# Content OS Notion

Plateforme Next.js connectee a tes bases Notion pour piloter les comptes, inspirations, contenus, calendrier, assets et performances.

## Installation

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Configuration Notion

1. Copier `.env.example` vers `.env.local`.
2. Ajouter `NOTION_TOKEN` dans `.env.local`.
3. Garder les IDs de bases deja fournis, sauf si tu changes tes bases Notion.

Important : `.env.local` est ignore par Git. Ne jamais pousser le token Notion sur GitHub.

## Variables

```txt
NOTION_TOKEN=
NOTION_ACCOUNTS_DB_ID=140f618895504e0fa83ded3c0ebfecbf
NOTION_SOURCES_DB_ID=da15d5d4d47a4544b1748eddf3fd2db1
NOTION_INPUT_CONTENT_DB_ID=2442270b421880959cf4cb203e38b0b9
NOTION_CONTENTS_DB_ID=371848857a924f6d8dc68ec681f78a6f
NOTION_PLATFORMS_DB_ID=1b72270b42188079b86ee65b41bfb1cd
```

## Commandes utiles

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Modifier sans etre dev

- Les textes et pages sont dans `app/`.
- Les boutons, badges, cartes et filtres sont dans `components/`.
- La connexion Notion est dans `lib/notion/`.
- Les noms des statuts viennent de Notion : si tu ajoutes, renommes ou supprimes un statut dans Notion, l'interface se met a jour au prochain chargement.
