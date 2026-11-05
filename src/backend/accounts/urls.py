from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register_view, current_user_view, logout_view, FitnessProfileView, EmailTokenObtainPairView

urlpatterns = [
    path('register/', register_view, name='auth-register'),
    path('login/', EmailTokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout/', logout_view, name='auth-logout'),
    path('me/', current_user_view, name='auth-me'),
    path('assessment/', FitnessProfileView.as_view(), name='fitness-assessment'),
    path('me/onboarding/', FitnessProfileView.as_view(), name='me-onboarding'),
]