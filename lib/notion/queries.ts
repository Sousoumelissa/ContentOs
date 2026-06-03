import { getDatabaseId, notionProperties } from "./config";
import { queryAllDatabasePages, retrieveDatabase } from "./client";
import { mapBrand, mapContent, mapInput, mapPlatform, mapSource } from "./mappings";
import { schemaOptions } from "./property-readers";
import type { BootstrapData, DatabaseKey, NotionSchemas } from "./types";

const databaseKeys: DatabaseKey[] = ["brands", "sources", "inputs", "contents", "platforms"];

// Cette fonction charge tout ce dont l'interface a besoin au demarrage.
// Les statuts et formats viennent du schema Notion, donc ils restent dynamiques.
export async function getBootstrapData(): Promise<BootstrapData> {
  const loaded = await loadNotionData();
  const databases = loaded.databases;
  const pagesByDatabase = loaded.pages;

  const brands = pagesByDatabase.brands.map(mapBrand);
  const sources = pagesByDatabase.sources.map(mapSource);
  const inputs = pagesByDatabase.inputs.map(mapInput);
  const contents = pagesByDatabase.contents.map(mapContent);
  const platforms = pagesByDatabase.platforms.map(mapPlatform);

  const pageTitles: Record<string, string> = {};
  brands.forEach((item) => (pageTitles[item.id] = item.name || "Sans titre"));
  sources.forEach((item) => (pageTitles[item.id] = item.name || "Sans titre"));
  inputs.forEach((item) => (pageTitles[item.id] = item.title || "Sans titre"));
  contents.forEach((item) => (pageTitles[item.id] = item.title || "Sans titre"));
  platforms.forEach((item) => (pageTitles[item.id] = item.name || "Sans titre"));

  return {
    brands,
    sources,
    inputs,
    contents,
    platforms,
    schemas: buildSchemas(databases),
    pageTitles,
    warnings: loaded.warnings,
    updatedAt: new Date().toISOString()
  };
}

async function loadNotionData() {
  const entries = await Promise.all(databaseKeys.map(loadDatabaseSafely));
  const databases = {} as Partial<Record<DatabaseKey, any>>;
  const pages = {} as Record<DatabaseKey, any[]>;
  const warnings: string[] = [];

  entries.forEach(([key, result]) => {
    pages[key] = result.pages;
    if (result.database) databases[key] = result.database;
    if (result.warning) warnings.push(result.warning);
  });

  return {
    databases,
    pages,
    warnings
  };
}

async function loadDatabaseSafely(key: DatabaseKey) {
  try {
    const databaseId = getDatabaseId(key);
    const [database, pages] = await Promise.all([
      retrieveDatabase(databaseId),
      queryAllDatabasePages(databaseId)
    ]);

    return [key, { database, pages, warning: "" }] as const;
  } catch (error) {
    const envKey = keyToReadableName(key);
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    return [
      key,
      {
        database: null,
        pages: [] as any[],
        warning: `${envKey} non chargee. Verifie que cette base est partagee avec l'integration Notion. Detail: ${message}`
      }
    ] as const;
  }
}

function buildSchemas(databases: Partial<Record<DatabaseKey, any>>): NotionSchemas {
  const status: NotionSchemas["status"] = {};
  const format: NotionSchemas["format"] = {};

  databaseKeys.forEach((key) => {
    status[key] = databases[key] ? schemaOptions(databases[key], notionProperties.status) : [];
    format[key] = databases[key] ? schemaOptions(databases[key], notionProperties.format) : [];
  });

  return { status, format };
}

function keyToReadableName(key: DatabaseKey) {
  const names: Record<DatabaseKey, string> = {
    brands: "[Brands]",
    sources: "[Competitors]",
    inputs: "[Input Content]",
    contents: "[Content hub]",
    platforms: "[Platforms]"
  };

  return names[key];
}
