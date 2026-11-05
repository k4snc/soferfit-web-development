from rest_framework import serializers
from .models import Exercise, Workout, WorkoutExercise, Program, ProgramDay, UserChallenge, WorkoutSession, PhysicalProgress

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'description', 'category', 'target_muscle', 'equipment_needed', 'default_sets', 'default_reps', 'created_at']

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(), source='exercise', write_only=True
    )

    class Meta:
        model = WorkoutExercise
        fields = ['id', 'exercise', 'exercise_id', 'order', 'sets', 'reps']

class WorkoutSerializer(serializers.ModelSerializer):
    workout_exercises = WorkoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = ['id', 'title', 'description', 'fitness_level', 'fitness_goal', 'workout_exercises', 'created_at']

class ProgramDaySerializer(serializers.ModelSerializer):
    workout = WorkoutSerializer(read_only=True)
    workout_id = serializers.PrimaryKeyRelatedField(
        queryset=Workout.objects.all(), source='workout', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = ProgramDay
        fields = ['id', 'day_number', 'workout', 'workout_id', 'is_rest_day']

class ProgramSerializer(serializers.ModelSerializer):
    program_days = ProgramDaySerializer(many=True, read_only=True)

    class Meta:
        model = Program
        fields = ['id', 'title', 'description', 'duration_days', 'fitness_level', 'fitness_goal', 'program_days', 'created_at']

class UserChallengeSerializer(serializers.ModelSerializer):
    program = ProgramSerializer(read_only=True)
    program_id = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(), source='program', write_only=True
    )

    class Meta:
        model = UserChallenge
        fields = ['id', 'program', 'program_id', 'start_date', 'is_active']
        read_only_fields = ['start_date', 'is_active']

class WorkoutSessionSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source='workout.title', read_only=True)

    class Meta:
        model = WorkoutSession
        fields = ['id', 'workout', 'workout_title', 'date', 'duration_minutes', 'is_completed', 'effort', 'exercises_done', 'created_at']
        read_only_fields = ['date', 'created_at']

class PhysicalProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalProgress
        fields = ['id', 'weight', 'body_fat_percentage', 'notes', 'date', 'created_at']
        read_only_fields = ['date', 'created_at']