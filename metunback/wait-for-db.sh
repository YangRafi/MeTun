#!/bin/sh
# wait-for-db.sh
set -e

host="$1"
shift

echo "Czekam na bazę danych $host..."
until nc -z $(echo $host | cut -d: -f1) $(echo $host | cut -d: -f2); do
  sleep 1
done

echo "Baza danych jest gotowa! Uruchamiam backend..."
exec "$@"
