#!/bin/sh
# docker-entrypoint.sh

# Czekaj na bazę danych
./wait-for-db.sh db:3306

# Sprawdź, czy baza jest pusta (czy istnieje tabela 'users')
DB_EXIST=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SHOW TABLES LIKE 'users';" | grep users || true)

if [ -z "$DB_EXIST" ]; then
  echo "🌱 Seedowanie bazy danych..."
  node seeders/seed.js
else
  echo "✅ Baza już zainicjalizowana, pomijam seedowanie."
fi

# Uruchom backend
echo "🚀 Start backendu..."
npm start
