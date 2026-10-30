from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import EmailTokenObtainPairSerializer, UserRegistrationSerializer, UserProfileSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from rest_framework import generics
from .permissions import IsOwnerOrReadOnly
from .models import FitnessProfile
from .serializers import FitnessProfileSerializer


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Generate JWT tokens immediately upon successful registration
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "User registered successfully",
            "user": UserProfileSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception as e:
        # Gracefully handle missing or optional refresh tokens sent by frontends on logout
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)


class FitnessProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = FitnessProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Always return the logged-in user's profile
        profile, created = FitnessProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        # Extract height and weight to calculate informational BMI server-side
        height_cm = serializer.validated_data.get('height', self.get_object().height)
        weight_kg = serializer.validated_data.get('current_weight', self.get_object().current_weight)
        
        bmi_val = None
        if height_cm and weight_kg and height_cm > 0:
            height_m = height_cm / 100.0
            bmi_val = round(weight_kg / (height_m ** 2), 2)
            
        serializer.save(bmi=bmi_val)