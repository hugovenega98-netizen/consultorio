$ErrorActionPreference = "Stop"
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Creado .env desde .env.example"
}
Write-Host "1/4 Iniciando PostgreSQL..."
docker compose up -d db
Write-Host "2/4 Instalando dependencias..."
npm install
Write-Host "3/4 Preparando base de datos..."
npm run setup
Write-Host "4/4 Iniciando aplicación..."
Write-Host "Abrí http://localhost:3000. Desde otra PC usá http://IP-DE-ESTA-PC:3000"
npm run dev
