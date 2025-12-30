FROM node:20-alpine

WORKDIR /app

# Skopiuj package.json i package-lock.json i zainstaluj zależności
COPY package*.json ./
RUN npm install

# Skopiuj resztę plików
COPY . .

# Nadaj uprawnienia do skryptu entrypoint
RUN chmod +x wait-for-db.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Ustaw entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]