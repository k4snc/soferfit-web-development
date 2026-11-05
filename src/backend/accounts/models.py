from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('member', 'Member'),
        ('content_admin', 'Content Admin'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class FitnessProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='fitness_profile')
    age = models.PositiveIntegerField(null=True, blank=True)
    sex = models.CharField(max_length=20, blank=True)
    height = models.FloatField(null=True, blank=True)  # in cm
    current_weight = models.FloatField(null=True, blank=True)  # in kg
    target_weight = models.FloatField(null=True, blank=True)  # Added for frontend alignment
    bmi = models.FloatField(null=True, blank=True)
    body_type = models.CharField(max_length=30, blank=True)  # endomorph, ectomorph, mesomorph
    fitness_level = models.CharField(max_length=20, default='beginner')  # beginner, intermediate, advanced
    fitness_goal = models.CharField(max_length=50, default='weight_loss')  # weight loss, muscle gain, fitness, toning
    exercise_frequency = models.IntegerField(default=3)  # days per week
    workout_duration = models.CharField(max_length=30, default='30-45 mins')
    available_equipment = models.CharField(max_length=100, default='bodyweight')
    challenge_choice = models.IntegerField(default=60)  # 60 or 90 days
    
    # New onboarding metadata fields matching frontend expectations
    activity_level = models.CharField(max_length=50, blank=True)
    unit_system = models.CharField(max_length=10, default='metric') # metric / imperial
    target_timeline = models.CharField(max_length=50, blank=True)
    injury_status = models.TextField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Fitness Profile: {self.user.username}"


# Unified Signals: Automatically create UserProfile and FitnessProfile whenever a new Django User is created
@receiver(post_save, sender=User)
def create_user_profiles(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        FitnessProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profiles(sender, instance, **kwargs):
    instance.profile.save()
    instance.fitness_profile.save()