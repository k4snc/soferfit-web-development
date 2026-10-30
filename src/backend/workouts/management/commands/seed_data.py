from django.core.management.base import BaseCommand
from workouts.models import Exercise, Workout, WorkoutExercise, Program, ProgramDay

class Command(BaseCommand):
    help = 'Seeds initial exercises, workouts, and 60/90-day programs for frontend integration.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # 1. Create Exercises
        exercises_data = [
            {"name": "Push-up", "description": "Standard chest and triceps bodyweight push-up.", "category": "strength", "target_muscle": "chest", "equipment_needed": "bodyweight", "default_sets": 3, "default_reps": "12-15"},
            {"name": "Bodyweight Squat", "description": "Lower body squat focusing on quads and glutes.", "category": "strength", "target_muscle": "legs", "equipment_needed": "bodyweight", "default_sets": 3, "default_reps": "15"},
            {"name": "Plank", "description": "Core stabilization hold.", "category": "strength", "target_muscle": "core", "equipment_needed": "bodyweight", "default_sets": 3, "default_reps": "45 secs"},
            {"name": "Dumbbell Curl", "description": "Bicep curl using dumbbells.", "category": "strength", "target_muscle": "arms", "equipment_needed": "dumbbells", "default_sets": 3, "default_reps": "10-12"},
        ]

        exercise_objs = {}
        for ex in exercises_data:
            obj, created = Exercise.objects.get_or_create(name=ex["name"], defaults=ex)
            exercise_objs[ex["name"]] = obj
        self.stdout.write(self.style.SUCCESS(f'Created {len(exercise_objs)} exercises.'))

        # 2. Create Sample Workout
        workout_full_body, _ = Workout.objects.get_or_create(
            title="Beginner Full Body Foundation",
            defaults={"description": "A well-rounded full-body routine for beginners.", "fitness_level": "beginner", "fitness_goal": "weight_loss"}
        )

        # Link exercises to workout
        WorkoutExercise.objects.get_or_create(workout=workout_full_body, exercise=exercise_objs["Push-up"], order=1, sets=3, reps="12")
        WorkoutExercise.objects.get_or_create(workout=workout_full_body, exercise=exercise_objs["Bodyweight Squat"], order=2, sets=3, reps="15")
        WorkoutExercise.objects.get_or_create(workout=workout_full_body, exercise=exercise_objs["Plank"], order=3, sets=3, reps="45 secs")

        # 3. Create 60-Day Program
        program_60, _ = Program.objects.get_or_create(
            title="60-Day Total Transformation",
            defaults={"description": "Standard 60-day challenge program.", "duration_days": 5, "fitness_level": "beginner", "fitness_goal": "weight_loss"}
        )

        # Populate first few days of the program schedule
        for day in range(1, 6):
            is_rest = (day % 3 == 0) # Every 3rd day is rest
            ProgramDay.objects.get_or_create(
                program=program_60,
                day_number=day,
                defaults={
                    "workout": None if is_rest else workout_full_body,
                    "is_rest_day": is_rest
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded initial data!'))