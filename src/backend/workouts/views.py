from django.shortcuts import render
from datetime import date
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from accounts.permissions import IsContentAdmin
from .models import Exercise, Workout, Program, ProgramDay, UserChallenge, WorkoutSession
from .serializers import (
    ExerciseSerializer, WorkoutSerializer, 
    ProgramSerializer, ProgramDaySerializer, UserChallengeSerializer, WorkoutSessionSerializer, PhysicalProgressSerializer, PhysicalProgress
)

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all().order_by('-created_at')
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsContentAdmin()]
        return super().get_permissions()


class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.all().order_by('-created_at')
    serializer_class = WorkoutSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsContentAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=['GET'], url_path='today', permission_classes=[IsAuthenticated])
    def today_workout(self, request):
        user = request.user
        # 1. Find user's active challenge
        active_challenge = UserChallenge.objects.filter(user=user, is_active=True).first()
        
        if not active_challenge:
            return Response({"detail": "No active challenge found. Please select a program first."}, status=status.HTTP_404_NOT_FOUND)
            
        program = active_challenge.program
        
        # 2. Compute current day number based on elapsed days since start_date
        delta = date.today() - active_challenge.start_date
        current_day = max(1, delta.days + 1)
        if current_day > program.duration_days:
            current_day = program.duration_days
            
        # 3. Retrieve the ProgramDay for today
        program_day = ProgramDay.objects.filter(program=program, day_number=current_day).first()
        
        if not program_day:
            return Response({"detail": "No schedule found for today."}, status=status.HTTP_404_NOT_FOUND)
            
        # 4. Return rest day or workout prescription
        if program_day.is_rest_day or not program_day.workout:
            return Response({
                "day_number": current_day,
                "is_rest_day": True,
                "message": "Today is a scheduled rest day. Enjoy your recovery!"
            }, status=status.HTTP_200_OK)
            
        serializer = WorkoutSerializer(program_day.workout, context={'request': request})
        return Response({
            "day_number": current_day,
            "is_rest_day": False,
            "workout": serializer.data
        }, status=status.HTTP_200_OK)


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('-created_at')
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'add_day']:
            return [IsContentAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['POST'], permission_classes=[IsContentAdmin])
    def add_day(self, request, pk=None):
        program = self.get_object()
        serializer = ProgramDaySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(program=program)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def recommended(self, request):
        try:
            profile = request.user.fitness_profile
            programs = Program.objects.filter(
                fitness_level=profile.fitness_level,
                fitness_goal=profile.fitness_goal
            )
            serializer = self.get_serializer(programs, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": "Please complete your fitness assessment first."}, status=status.HTTP_400_BAD_REQUEST)
 
class UserChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = UserChallengeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserChallenge.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        UserChallenge.objects.filter(user=self.request.user, is_active=True).update(is_active=False)
        serializer.save(user=self.request.user)



class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user).order_by('-date', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['GET'], url_path='dashboard')
    def dashboard_overview(self, request):
        user = request.user
        active_challenge = UserChallenge.objects.filter(user=user, is_active=True).first()
        
        current_day = 1
        completion_percentage = 0.0
        program_title = None
        
        if active_challenge:
            program = active_challenge.program
            program_title = program.title
            delta = date.today() - active_challenge.start_date
            current_day = max(1, delta.days + 1)
            if current_day > program.duration_days:
                current_day = program.duration_days
            completion_percentage = round((current_day / program.duration_days) * 100, 2)

        completed_sessions_count = WorkoutSession.objects.filter(user=user, is_completed=True).count()
        streak = completed_sessions_count

        return Response({
            "username": user.username,
            "active_challenge": program_title,
            "current_challenge_day": current_day,
            "challenge_completion_percentage": completion_percentage,
            "workouts_completed_count": completed_sessions_count,
            "workout_streak": streak
        }, status=status.HTTP_200_OK)


class PhysicalProgressViewSet(viewsets.ModelViewSet):
    serializer_class = PhysicalProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PhysicalProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)