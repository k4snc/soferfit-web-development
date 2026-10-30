from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from .models import UserProfile, FitnessProfile
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        
        # Automatically derive a unique username from the email prefix to satisfy Django requirements
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Create user with hashed password
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data['password']
        )
        
        # Ensure UserProfile exists and strictly enforce 'member' role for public signups
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = 'member'
        profile.save()
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    createdAt = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'createdAt']


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop(self.username_field, None)

    def validate(self, attrs):
        email = attrs.pop("email")
        username = User.objects.filter(email__iexact=email).values_list("username", flat=True).first()
        if not username:
            raise AuthenticationFailed("No active account found with the given credentials")

        attrs[self.username_field] = username
        return super().validate(attrs)


class FitnessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessProfile
        fields = [
            'age', 'sex', 'height', 'current_weight', 'target_weight', 'bmi', 
            'body_type', 'fitness_level', 'fitness_goal', 
            'exercise_frequency', 'workout_duration', 
            'available_equipment', 'challenge_choice', 
            'activity_level', 'unit_system', 'target_timeline', 'injury_status',
            'updated_at'
        ]
        read_only_fields = ['bmi', 'updated_at']