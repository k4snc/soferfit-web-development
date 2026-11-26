from datetime import date
from unittest.mock import patch

from accounts.throttles import LoginRateThrottle, RegistrationRateThrottle
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError, connection, transaction
from django.db.utils import OperationalError
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.token_blacklist.models import (
    BlacklistedToken,
    OutstandingToken,
)
from rest_framework_simplejwt.tokens import RefreshToken
from workouts.models import PhysicalProgress, SavedWorkoutPlan, WorkoutSession


User = get_user_model()


class AuthenticationSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_login_is_rate_limited(self):
        url = reverse("auth-login")
        payload = {"email": "missing@example.test", "password": "wrong-password"}

        with patch.object(LoginRateThrottle, "THROTTLE_RATES", {"login": "1/minute"}):
            first_response = self.client.post(url, payload, format="json")
            second_response = self.client.post(url, payload, format="json")

        self.assertEqual(first_response.status_code, 401)
        self.assertEqual(second_response.status_code, 429)

    def test_registration_is_rate_limited(self):
        url = reverse("auth-register")
        payload = {
            "email": "new-member@example.test",
            "password": "secure-test-password",
        }

        with patch.object(
            RegistrationRateThrottle,
            "THROTTLE_RATES",
            {"register": "1/minute"},
        ):
            first_response = self.client.post(url, payload, format="json")
            second_response = self.client.post(url, payload, format="json")

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 429)

    def test_logout_rejects_invalid_refresh_token(self):
        user = get_user_model().objects.create_user(
            username="logout-member",
            password="secure-test-password",
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            reverse("auth-logout"),
            {"refresh": "not-a-valid-refresh-token"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_logout_without_refresh_token_remains_idempotent(self):
        user = get_user_model().objects.create_user(
            username="logout-without-token",
            password="secure-test-password",
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(reverse("auth-logout"), {}, format="json")

        self.assertEqual(response.status_code, 200)


class RegistrationValidationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_registration_normalizes_email_and_rejects_case_insensitive_duplicates(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "Case.Member@example.test",
                "password": "Secure-test-password-2026!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["email"], "case.member@example.test")

        duplicate_response = self.client.post(
            reverse("auth-register"),
            {
                "email": "CASE.MEMBER@EXAMPLE.TEST",
                "password": "Another-secure-password-2026!",
            },
            format="json",
        )

        self.assertEqual(duplicate_response.status_code, 400)
        self.assertEqual(User.objects.filter(email__iexact="case.member@example.test").count(), 1)

    def test_registration_uses_configured_password_validators(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "password-test@example.test",
                "password": "password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(email="password-test@example.test").exists())

    def test_database_rejects_case_insensitive_duplicate_emails(self):
        with connection.cursor() as cursor:
            constraints = connection.introspection.get_constraints(
                cursor,
                User._meta.db_table,
            )
        self.assertIn("auth_user_email_ci_unique", constraints)

        User.objects.create_user(
            username="mixed-case",
            email="Mixed.Case@example.test",
            password="Secure-test-password-2026!",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    username="lower-case",
                    email="mixed.case@example.test",
                    password="Another-secure-password-2026!",
                )


class AccountLifecycleTests(APITestCase):
    def test_anonymous_user_cannot_delete_account(self):
        response = self.client.delete(reverse("auth-me"))

        self.assertEqual(response.status_code, 401)

    def test_delete_account_removes_user_data_and_revokes_refresh_tokens(self):
        user = User.objects.create_user(
            username="delete-member",
            email="delete-member@example.test",
            password="Secure-test-password-2026!",
        )
        session = WorkoutSession.objects.create(user=user)
        progress = PhysicalProgress.objects.create(user=user, weight=72.5)
        plan = SavedWorkoutPlan.objects.create(
            user=user,
            start_date=date(2026, 1, 5),
            schedule=[],
        )
        refresh_token = RefreshToken.for_user(user)
        outstanding_token = OutstandingToken.objects.get(jti=refresh_token["jti"])
        self.client.force_authenticate(user=user)

        response = self.client.delete(reverse("auth-me"))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertFalse(WorkoutSession.objects.filter(pk=session.pk).exists())
        self.assertFalse(PhysicalProgress.objects.filter(pk=progress.pk).exists())
        self.assertFalse(SavedWorkoutPlan.objects.filter(pk=plan.pk).exists())

        outstanding_token.refresh_from_db()
        self.assertIsNone(outstanding_token.user)
        self.assertEqual(outstanding_token.token, "")
        self.assertTrue(
            BlacklistedToken.objects.filter(token=outstanding_token).exists()
        )

        refresh_response = APIClient().post(
            reverse("auth-token-refresh"),
            {"refresh": str(refresh_token)},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, 401)


class HealthCheckTests(APITestCase):
    def test_health_check_reports_database_readiness(self):
        response = self.client.get(reverse("health-check"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"status": "ok"})

    def test_health_check_returns_unavailable_when_database_is_down(self):
        with (
            patch("accounts.views.connection.cursor", side_effect=OperationalError("down")),
            patch("accounts.views.logger.exception"),
        ):
            response = self.client.get(reverse("health-check"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data, {"status": "unavailable"})
