# Backend Dockerfile for SoferFit
# Uses official Python image and installs backend dependencies
FROM python:3.13-slim AS base
WORKDIR /app

# Install system dependencies (psycopg2 needs gcc & libpq-dev)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the backend requirements first for caching
COPY src/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source tree
COPY src/backend .

# Copy the entrypoint script
COPY entrypoint.sh ./entrypoint.sh

# Ensure the entrypoint is executable
RUN chmod +x ./entrypoint.sh

# Set environment variables for Django
ENV PYTHONUNBUFFERED=1 \
    DJANGO_ENV=production \
    DJANGO_DEBUG=False

# Collect static files (if any) and run migrations at container start
CMD ["sh", "-c", "python manage.py migrate && gunicorn soferfit.wsgi:application --bind 0.0.0.0:8000"]
