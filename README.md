# API de Gestion des CVE

Cette API permet de consulter et rechercher des informations sur les vulnérabilités CVE (Common Vulnerabilities and Exposures), les vendeurs et les produits affectés.

## Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Routes disponibles](#routes-disponibles)
    - [CVE](#cve)
    - [Vendeurs](#vendeurs)
    - [Produits](#produits)
    - [Recherche](#recherche)
- [Exemples d'utilisation](#exemples-dutilisation)

## Installation

```bash
# Cloner le dépôt
git clone <url-du-dépôt>
cd api-cve

# Installer les dépendances
npm install
```

## Configuration

1. Créez un fichier `.env` à la racine du projet en vous basant sur le fichier `.env.example`
2. Configurez les variables d'environnement selon votre environnement :

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cve-database
```

## Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

L'API sera disponible à l'adresse : `http://localhost:3000`

## Routes disponibles

### CVE

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/cves` | Récupérer tous les CVE avec pagination |
| GET | `/api/cves/:cveId` | Récupérer un CVE spécifique par son ID |
| GET | `/api/cves/severity/:severity` | Récupérer les CVE par niveau de sévérité |
| GET | `/api/cves/product/:productId` | Récupérer les CVE pour un produit spécifique |
| GET | `/api/cves/vendor/:vendorId` | Récupérer les CVE pour un vendeur spécifique |
| GET | `/api/cves/search` | Rechercher des CVE par texte |
| GET | `/api/cves/stats/summary` | Récupérer les statistiques générales des CVE |
| GET | `/api/cves/stats/timeline` | Récupérer les statistiques temporelles des CVE |

### Vendeurs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/vendors` | Récupérer tous les vendeurs avec pagination |
| GET | `/api/vendors/:id` | Récupérer un vendeur spécifique par son ID |
| GET | `/api/vendors/name/:name` | Récupérer un vendeur par son nom |
| GET | `/api/vendors/search` | Rechercher des vendeurs par texte |
| GET | `/api/vendors/:id/products` | Récupérer les produits d'un vendeur |
| GET | `/api/vendors/stats/summary` | Récupérer les statistiques des vendeurs |
| GET | `/api/vendors/:id/stats` | Récupérer les statistiques des CVE pour un vendeur |

### Produits

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/products` | Récupérer tous les produits avec pagination |
| GET | `/api/products/:id` | Récupérer un produit spécifique par son ID |
| GET | `/api/products/vendor/:vendorId/name/:productName` | Récupérer un produit par son nom et son vendeur |
| GET | `/api/products/search` | Rechercher des produits par texte |
| GET | `/api/products/:id/cves` | Récupérer les CVE pour un produit |
| GET | `/api/products/:id/versions` | Récupérer les versions d'un produit |
| GET | `/api/products/stats/summary` | Récupérer les statistiques des produits |
| GET | `/api/products/:id/stats` | Récupérer les statistiques des CVE pour un produit |

### Recherche

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/search` | Recherche globale sur tous les modèles |
| POST | `/api/search/advanced` | Recherche avancée avec filtres multiples |
| GET | `/api/search/suggestions` | Suggérer des termes pour l'autocomplétion |

## Exemples d'utilisation

### Récupérer tous les CVE (paginés)

```
GET /api/cves?page=1&limit=20&sortBy=publishedDate&sortOrder=desc
```

### Rechercher un CVE par ID

```
GET /api/cves/CVE-2021-44228
```

### Rechercher les CVE avec une sévérité critique

```
GET /api/cves/severity/CRITICAL
```

### Recherche avancée de CVE

```
POST /api/search/advanced
Content-Type: application/json

{
  "vendor": "Microsoft",
  "severity": "HIGH",
  "startDate": "2023-01-01",
  "endDate": "2023-12-31"
}
```

### Autocomplétion

```
GET /api/search/suggestions?prefix=apache&type=vendor
```