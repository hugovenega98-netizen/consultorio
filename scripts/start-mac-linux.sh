#!/usr/bin/env bash
set -e

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Creado .env desde .env.example"
fi

echo "1/4 Iniciando PostgreSQL..."
docker compose up -d db

echo "2/4 Instalando dependencias..."
npm install

echo "3/4 Preparando base de datos..."
npm run setup

echo "4/4 Iniciando aplicación..."
echo "Abrí http://localhost:3000 en esta PC. Desde otra PC usá http://IP-DE-ESTA-PC:3000"
npm run dev
