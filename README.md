<div align="center">
  <img width="1200" height="475" alt="Gestion Boucherie Pro Banner" src="https://via.placeholder.com/1200x475/1e293b/ffffff?text=Gestion+Boucherie+Pro+-+Système+de+Gestion" />
</div>

<div align="center">
  <h1>🥩 Gestion Boucherie Pro</h1>
  <p>Système de gestion complet pour boucherie</p>
</div>

## Fonctionnalités

- **Point de vente (POS)** - Interface de caisse avec gestion des paiements
- **Gestion des stocks** - Suivi des produits, alertes de stock bas, historique des approvisionnements
- **Suivi des dépenses** - Catégorisation et tracking des dépenses commerciales
- **Sessions de caisse** - Gestion journalière du fond de caisse
- **Dashboard** - Statistiques et KPIs en temps réel

## Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn

## Installation

1. Installer les dépendances:
   ```bash
   npm install
   ```

2. Initialiser la base de données:
   ```bash
   npx prisma migrate dev
   ```

3. Lancer l'application:
   ```bash
   npm run dev
   ```

L'application sera accessible sur `http://localhost:3000`

## Build pour production

```bash
npm run build
```

## Stack Technique

- React 19 + TypeScript
- Vite
- TailwindCSS v4
- Zustand (state management)
- Prisma + SQLite
- Express.js
