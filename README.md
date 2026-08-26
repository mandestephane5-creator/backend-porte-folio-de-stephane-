# Backend — Stéphane Mande

## Installation

```bash
npm install
cp .env.example .env
```

Puis ouvrez `.env` et remplissez les vraies valeurs (voir ci-dessous).

## 1. Configurer Supabase

1. Créez un compte sur [supabase.com](https://supabase.com) et un nouveau projet.
2. Allez dans **SQL Editor**, collez tout le contenu de `sql/schema.sql`, exécutez.
   → Ça crée les 3 tables (`admin_users`, `messages`, `projects`) et insère vos 5 vrais projets.
3. Allez dans **Project Settings > API**, copiez :
   - `Project URL` → collez dans `.env` comme `SUPABASE_URL`
   - `service_role` key (⚠️ pas la `anon` key) → collez dans `.env` comme `SUPABASE_SERVICE_ROLE_KEY`

## 2. Générer une clé secrète

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Collez le résultat dans `.env` comme `JWT_SECRET`.

## 3. Lancer le serveur

```bash
npm start
```

## 4. Créer votre compte admin (une seule fois)

```bash
node scripts/create-admin.js votre@email.com VotreMotDePasse123
```
Le mot de passe doit faire au moins 8 caractères. Ce script n'est **pas** une route accessible depuis le web — c'est volontaire, pour qu'il n'y ait aucun moyen public de créer un compte admin.

## 5. Tester

```bash
npm start
```

Le serveur démarre sur `http://localhost:4000`. Testez avec :
```bash
curl http://localhost:4000/api/health
```
Vous devriez voir `{"status":"ok", ...}`.

Testez la connexion :
```bash
curl -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.com","password":"VotreMotDePasse123"}'

curl -b cookies.txt http://localhost:4000/api/auth/me
```

## Routes disponibles

**Publiques**
- `GET /api/health`
- `GET /api/projects`, `GET /api/domains`, `GET /api/services`, `GET /api/skills`
- `GET /api/journey`, `GET /api/hero`, `GET /api/about`
- `GET /api/articles`, `GET /api/articles/:slug`
- `GET /api/theme`, `GET /api/settings`, `GET /api/seo`
- `GET /api/socials`, `GET /api/navigation`
- `POST /api/contact`, `POST /api/start-project`

**Authentification**
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

**Admin (protégées, nécessitent une connexion)**
- Projets : `GET/POST /api/admin/projects`, `PATCH/DELETE /api/admin/projects/:id`
- Domaines : `GET/POST /api/admin/domains`, `PATCH/DELETE /api/admin/domains/:id`
- Solutions : `POST /api/admin/solutions`, `PATCH/DELETE /api/admin/solutions/:id`
- Services : `GET/POST /api/admin/services`, `PATCH/DELETE /api/admin/services/:id`
- Catégories de compétences : `GET/POST /api/admin/skill-categories`, `PATCH/DELETE .../:id`
- Compétences : `GET/POST /api/admin/skills`, `PATCH/DELETE /api/admin/skills/:id`
- Parcours : `GET/POST /api/admin/journey`, `PATCH/DELETE /api/admin/journey/:id`
- Hero : `PATCH /api/admin/hero`
- À propos : `PATCH /api/admin/about`
- Blog : `GET/POST /api/admin/articles`, `PATCH/DELETE /api/admin/articles/:id`
- Messages : `GET /api/admin/messages` (filtres `?status=` `?type=` `?q=`), `PATCH/DELETE .../:id`
- Médias : `GET/POST /api/admin/media`, `DELETE /api/admin/media/:id` (bloqué si l'image est encore utilisée)
- Apparence : `PATCH /api/admin/theme`, `POST /api/admin/theme/reset`
- Paramètres : `PATCH /api/admin/settings`
- SEO : `PATCH /api/admin/seo`
- Réseaux sociaux : `GET/POST /api/admin/socials`, `PATCH/DELETE .../:id`
- Navigation : `GET/POST /api/admin/navigation`, `PATCH/DELETE .../:id`

**Limite connue** : la gestion des médias enregistre des URLs d'images (pas de vrai téléversement de fichier depuis le dashboard pour l'instant — il faudrait brancher Supabase Storage, non fait dans cette tranche).

**Dashboard** : seules les pages Connexion, Accueil et Projets existent visuellement pour l'instant (voir le dossier `dashboard/` séparé). Les routes API ci-dessus sont prêtes ; il reste à construire les pages d'interface pour Services, Compétences, Domaines, Blog, Messages, Médias, Apparence, Paramètres, SEO, Navigation et Réseaux sociaux, en suivant le même modèle que `projects.html`.

## Déploiement

Ce serveur peut être hébergé sur **Railway** ou **Render** (gratuits pour démarrer). Une fois en ligne, mettez à jour `ALLOWED_ORIGINS` dans `.env` avec l'URL réelle de votre site, et l'URL du frontend devra pointer vers l'URL de ce serveur au lieu de `localhost:4000`.
