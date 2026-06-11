# DocDrive — Guide d'installation

## Prérequis

- Node.js 18+
- Docker Desktop (pour PostgreSQL)
- Un compte Cloudflare (optionnel, pour le stockage R2 en production)

---

## Installation rapide

### Windows (PowerShell)
```powershell
cd docdrive
.\scripts\setup.ps1
```

### Linux / macOS
```bash
cd docdrive
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## Installation manuelle

### 1. Variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` et renseignez **obligatoirement** :
```
AUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=postgresql://docdrive:password@localhost:5432/docdrive
```

### 2. Dépendances

```bash
npm install
```

### 3. Base de données

```bash
# Démarrer PostgreSQL
docker compose up -d postgres

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Données initiales (admin + dossiers de démo)
npm run db:seed
```

### 4. Lancer en développement

```bash
npm run dev
```

Accédez à http://localhost:3000

---

## Comptes par défaut (seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@docdrive.fr | Admin@2028! |
| Utilisateur | utilisateur@docdrive.fr | User@2028! |

> **Changez ces mots de passe immédiatement en production.**

---

## Configuration du stockage

### Développement (local)
```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads
```
Les fichiers sont stockés dans `./uploads/`. Ce dossier ne doit **pas** être commité.

### Production (Cloudflare R2)
```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key
R2_SECRET_ACCESS_KEY=votre_secret_key
R2_BUCKET_NAME=docdrive-docs
```

1. Créez un bucket R2 dans votre tableau de bord Cloudflare
2. Créez un token API avec accès `Object Read & Write` sur ce bucket
3. Renseignez les variables ci-dessus

---

## Déploiement en production (Vercel)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

Configurez les variables d'environnement dans le tableau de bord Vercel :
- `DATABASE_URL` (base PostgreSQL hébergée — ex: Neon, Supabase, Railway)
- `AUTH_SECRET`
- `STORAGE_PROVIDER=r2`
- Variables R2

---

## Déploiement VPS (Docker)

```dockerfile
# Dockerfile (à créer selon vos besoins)
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
RUN npm run db:generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm run db:migrate` | Appliquer les migrations |
| `npm run db:seed` | Données initiales |
| `npm run db:studio` | Interface visuelle Prisma |

---

## Structure des dossiers

```
docdrive/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Page de connexion
│   ├── (dashboard)/        # Pages protégées
│   └── api/                # API Routes
├── components/             # Composants React
│   ├── ui/                 # Composants génériques
│   ├── auth/               # Formulaire de connexion
│   ├── documents/          # FileBrowser, Upload, etc.
│   ├── admin/              # Gestion utilisateurs
│   └── layout/             # Sidebar, Header
├── lib/                    # Utilitaires serveur
│   ├── auth.ts             # Configuration NextAuth
│   ├── prisma.ts           # Client Prisma
│   ├── storage.ts          # Abstraction stockage
│   ├── validations.ts      # Schémas Zod
│   ├── audit.ts            # Journalisation
│   └── rate-limit.ts       # Protection brute-force
├── prisma/
│   ├── schema.prisma       # Schéma de base de données
│   └── seed.ts             # Données initiales
├── middleware.ts           # Protection des routes
├── docker-compose.yml      # PostgreSQL local
└── .env.example            # Template variables
```

---

## Évolutions futures suggérées

- **Prévisualisation PDF** in-browser (`react-pdf`)
- **Recherche full-text** (`pg_trgm` ou Meilisearch)
- **Notifications email** via Resend (invitation, reset)
- **2FA TOTP** pour les administrateurs
- **Export CSV** du journal d'audit
- **Tags** sur les documents
- **API REST publique** pour intégrations (migration vers NestJS)
- **Partage** de dossier avec lien temporaire signé
