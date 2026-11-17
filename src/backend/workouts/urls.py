from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExerciseViewSet, WorkoutViewSet, ProgramViewSet, UserChallengeViewSet, WorkoutSessionViewSet, SavedWorkoutPlanView, PhysicalProgressViewSet

router = DefaultRouter()
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'challenges', UserChallengeViewSet, basename='userchallenge')
router.register(r'sessions', WorkoutSessionViewSet, basename='workoutsession')
router.register(r'progress', PhysicalProgressViewSet, basename='physicalprogress')


urlpatterns = [
    path('plan/', SavedWorkoutPlanView.as_view(), name='saved-workout-plan'),
    path('', include(router.urls)),
]