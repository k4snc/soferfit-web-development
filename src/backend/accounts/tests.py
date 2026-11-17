from unittest.mock import patch

from accounts.throttles import LoginRateThrottle, RegistrationRateThrottle
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase


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

# Create your tests here.
