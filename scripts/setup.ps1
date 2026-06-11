# Script de configuration initiale — DocdDrive
# Prérequis : Node.js 18+, Docker Desktop

Write-Host "=== Configuration de DocDrive ===" -ForegroundColor Cyan

# 1. Vérifier Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERREUR: Node.js non trouvé. Installez Node.js 18+ depuis https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# 2. Copier .env
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "Fichier .env.local créé depuis .env.example" -ForegroundColor Yellow
    Write-Host "IMPORTANT: Éditez .env.local et renseignez AUTH_SECRET" -ForegroundColor Yellow
} else {
    Write-Host ".env.local déjà présent" -ForegroundColor Green
}

# 3. Installer les dépendances
Write-Host "`nInstallation des dépendances npm..." -ForegroundColor Cyan
npm install
if (-not $?) { Write-Host "ERREUR: npm install a échoué" -ForegroundColor Red; exit 1 }

# 4. Démarrer la base de données
Write-Host "`nDémarrage de PostgreSQL via Docker..." -ForegroundColor Cyan
docker compose up -d postgres
if (-not $?) { Write-Host "ERREUR: Docker non disponible. Installez Docker Desktop." -ForegroundColor Red; exit 1 }

# Attendre que PostgreSQL soit prêt
Write-Host "Attente de PostgreSQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 5. Générer le client Prisma
Write-Host "`nGénération du client Prisma..." -ForegroundColor Cyan
npm run db:generate

# 6. Migrations
Write-Host "`nApplication des migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

# 7. Seed
Write-Host "`nSeeding de la base de données..." -ForegroundColor Cyan
npm run db:seed

# 8. Créer le dossier uploads
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "Dossier uploads/ créé" -ForegroundColor Green
}

Write-Host "`n=== Configuration terminée ! ===" -ForegroundColor Green
Write-Host "Lancez le serveur avec: npm run dev" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Comptes de test:" -ForegroundColor Yellow
Write-Host "  Admin:        admin@docdrive.fr        /  Admin@2028!"
Write-Host "  Utilisateur:  utilisateur@docdrive.fr  /  User@2028!"
