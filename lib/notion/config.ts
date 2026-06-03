import type { DatabaseKey } from "./types";

export const databaseEnvKeys: Record<DatabaseKey, string> = {
  brands: "NOTION_ACCOUNTS_DB_ID",
  sources: "NOTION_SOURCES_DB_ID",
  inputs: "NOTION_INPUT_CONTENT_DB_ID",
  contents: "NOTION_CONTENTS_DB_ID",
  platforms: "NOTION_PLATFORMS_DB_ID"
};

// Ces noms sont les proprietes exactes dans Notion.
// Si tu renommes une colonne dans Notion, modifie son nom ici.
export const notionProperties = {
  status: "État",
  format: "Format",
  title: {
    brands: "Nom",
    sources: "Nom",
    inputs: "Nom",
    contents: "Idée/titre",
    platforms: "Nom"
  }
} as const;

export function getDatabaseId(key: DatabaseKey) {
  const envKey = databaseEnvKeys[key];
  const value = process.env[envKey];

  if (!value) {
    throw new Error(`Variable manquante: ${envKey}. Ajoute-la dans .env.local.`);
  }

  return value;
}

export function getNotionToken() {
  if (!process.env.NOTION_TOKEN) {
    throw new Error("Variable manquante: NOTION_TOKEN. Ajoute ton token dans .env.local.");
  }

  return process.env.NOTION_TOKEN;
}
