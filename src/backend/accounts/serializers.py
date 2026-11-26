from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from .models import UserProfile, FitnessProfile
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['email', 'password']

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def validate(self, attrs):
        email = attrs["email"]
        candidate_user = User(
            username=email.split("@", 1)[0],
            email=email,
        )
        try:
            validate_password(attrs["password"], user=candidate_user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages}) from error
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        
        # Automatically derive a unique username from the email prefix to satisfy Django requirements
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=validated_data['password'],
                )

                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.role = 'member'
                profile.save()
        except IntegrityError as error:
            if User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError({
                    "email": "A user with this email already exists.",
                }) from error
            raise

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