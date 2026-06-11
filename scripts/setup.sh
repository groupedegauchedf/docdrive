#!/bin/bash
# Script de configuration initiale — DocDrive
# Prérequis : Node.js 18+, Docker

set -e

echo "=== Configuration de DocDrive ==="

# 1. Copier .env
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "⚠️  Fichier .env.local créé. Renseignez AUTH_SECRET avant de continuer."
    echo "   Générez-en un avec: openssl rand -base64 32"
fi

# 2. Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# 3. Démarrer PostgreSQL
echo "🐘 Démarrage de PostgreSQL..."
docker compose up -d postgres
sleep 5

# 4. Prisma
echo "⚙️  Génération Prisma..."
npm run db:generate

echo "🗄️  Migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding..."
npm run db:seed

# 5. Dossier uploads
mkdir -p uploads

echo ""
echo "✅ Configuration terminée !"
echo "   Lancez: npm run dev"
echo "   URL:    http://localhost:3000"
echo ""
echo "Comptes de test:"
echo "  Admin:       admin@docdrive.fr       / Admin@2028!"
echo "  Utilisateur: utilisateur@docdrive.fr / User@2028!"
