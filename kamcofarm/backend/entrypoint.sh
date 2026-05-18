#!/bin/bash
set -e

echo "Waiting for database to be ready..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "Database ready!"

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
