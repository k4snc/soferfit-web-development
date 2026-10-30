from django.db import models
from django.contrib.auth.models import User



class Exercise(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50, default='strength') # e.g., strength, cardio, flexibility
    target_muscle = models.CharField(max_length=50, blank=True) # e.g., chest, legs, core
    equipment_needed = models.CharField(max_length=100, default='bodyweight') # matches assessment
    default_sets = models.PositiveIntegerField(default=3)
    default_reps = models.CharField(max_length=50, default='10-12') # can be reps or duration like "30 secs"
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.target_muscle})"



class Workout(models.Model):
    title = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    fitness_level = models.CharField(max_length=20, default='beginner')
    fitness_goal = models.CharField(max_length=50, default='weight_loss')
    exercises = models.ManyToManyField(Exercise, through='WorkoutExercise', related_name='workouts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class WorkoutExercise(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=1)
    sets = models.PositiveIntegerField(default=3)
    reps = models.CharField(max_length=50, default='10-12')

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.workout.title} -> {self.exercise.name} (Step {self.order})"




class Program(models.Model):
    title = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    duration_days = models.IntegerField(choices=[(60, '60 Days'), (90, '90 Days')], default=60)
    fitness_level = models.CharField(max_length=20, default='beginner')
    fitness_goal = models.CharField(max_length=50, default='weight_loss')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.duration_days} Days)"

class ProgramDay(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='program_days')
    day_number = models.PositiveIntegerField()
    workout = models.ForeignKey(Workout, on_delete=models.SET_NULL, null=True, blank=True)
    is_rest_day = models.BooleanField(default=False)

    class Meta:
        ordering = ['day_number']

    def __str__(self):
        status = "Rest Day" if self.is_rest_day else f"Workout: {self.workout}"
        return f"Day {self.day_number}: {status}"

class UserChallenge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges')
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    start_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}'s Challenge: {self.program.title}"



class WorkoutSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    workout = models.ForeignKey(Workout, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField(auto_now_add=True)
    duration_minutes = models.PositiveIntegerField(default=30)
    is_completed = models.BooleanField(default=True)

    effort = models.CharField(max_length=30, blank=True) # e.g. "moderate", "hard", "easy"
    exercises_done = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        workout_title = self.workout.title if self.workout else 'Workout'
        return f"{self.user.username} - {workout_title} ({self.date})"


class PhysicalProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='physical_progress')
    weight = models.FloatField() # in kg or lbs matching unit system
    body_fat_percentage = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.weight}kg ({self.date})"