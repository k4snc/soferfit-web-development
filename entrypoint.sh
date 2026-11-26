#!/bin/sh
set -e
# Apply database migrations
python manage.py migrate --noinput
# Start Gunicorn
exec gunicorn soferfit.wsgi:application --bind 0.0.0.0:8000
