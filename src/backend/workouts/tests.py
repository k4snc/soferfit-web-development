from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from workouts.models import SavedWorkoutPlan, WorkoutSession


User = get_user_model()


class WorkoutSessionOwnershipTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="test-pass-123")
        self.bob = User.objects.create_user(username="bob", password="test-pass-123")
        self.alice_session = WorkoutSession.objects.create(user=self.alice)
        self.bob_session = WorkoutSession.objects.create(user=self.bob)

    def test_user_lists_only_their_own_sessions(self):
        self.client.force_authenticate(user=self.alice)

        response = self.client.get("/api/workouts/sessions/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {session["id"] for session in response.data},
            {self.alice_session.id},
        )

    def test_user_cannot_retrieve_another_users_session(self):
        self.client.force_authenticate(user=self.alice)

        response = self.client.get(
            f"/api/workouts/sessions/{self.bob_session.id}/"
        )

        self.assertEqual(response.status_code, 404)

    def test_anonymous_user_cannot_list_sessions(self):
        response = self.client.get("/api/workouts/sessions/")

        self.assertEqual(response.status_code, 401)


class SavedWorkoutPlanAccessTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="plan-alice", password="test-pass-123")
        self.bob = User.objects.create_user(username="plan-bob", password="test-pass-123")
        self.url = reverse("saved-workout-plan")
        self.payload = {
            "start_date": "2026-01-05",
            "duration_days": 60,
            "days_per_week": 4,
            "session_minutes": 45,
            "schedule": [{
                "id": "workout-1",
                "date": "2026-01-05",
                "name": "Full Body Strength",
                "minutes": 45,
                "equipment": "Bodyweight / Home",
                "target_tags": ["Strength", "Core"],
                "exercises": [{
                    "name": "Bodyweight squats",
                    "prescription": "3 × 12 reps",
                }],
                "intensity": "Moderate",
                "low_impact": False,
            }],
        }

    def test_anonymous_users_cannot_read_or_save_a_plan(self):
        get_response = self.client.get(self.url)
        put_response = self.client.put(self.url, self.payload, format="json")

        self.assertEqual(get_response.status_code, 401)
        self.assertEqual(put_response.status_code, 401)

    def test_user_can_save_and_resume_their_plan(self):
        self.client.force_authenticate(user=self.alice)

        save_response = self.client.put(self.url, self.payload, format="json")
        read_response = self.client.get(self.url)

        self.assertEqual(save_response.status_code, 201)
        self.assertEqual(read_response.status_code, 200)
        self.assertEqual(read_response.data["plan"]["schedule"][0]["id"], "workout-1")
        self.assertEqual(SavedWorkoutPlan.objects.filter(user=self.alice).count(), 1)

    def test_plan_is_private_and_each_user_has_their_own(self):
        self.client.force_authenticate(user=self.alice)
        self.client.put(self.url, self.payload, format="json")

        self.client.force_authenticate(user=self.bob)
        empty_response = self.client.get(self.url)
        bob_payload = {**self.payload, "schedule": []}
        save_response = self.client.put(self.url, bob_payload, format="json")

        self.client.force_authenticate(user=self.alice)
        alice_response = self.client.get(self.url)

        self.assertIsNone(empty_response.data["plan"])
        self.assertEqual(save_response.status_code, 201)
        self.assertEqual(alice_response.data["plan"]["schedule"][0]["id"], "workout-1")
        self.assertEqual(SavedWorkoutPlan.objects.count(), 2)

    def test_duplicate_workout_ids_are_rejected(self):
        self.client.force_authenticate(user=self.alice)
        duplicate = {
            **self.payload["schedule"][0],
            "date": "2026-01-06",
        }
        payload = {
            **self.payload,
            "schedule": [self.payload["schedule"][0], duplicate],
        }

        response = self.client.put(self.url, payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(SavedWorkoutPlan.objects.count(), 0)