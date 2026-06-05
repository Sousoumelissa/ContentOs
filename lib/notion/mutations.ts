import { getDatabaseId, notionProperties } from "./config";
import { createDatabasePage, retrieveDatabase, retrievePage, updatePageProperties } from "./client";
import {
  relationValue,
  richTextValue,
  schemaOptions,
  selectValue,
  statusValue,
  titleValue,
  urlValue,
  multiSelectValue
} from "./property-readers";
import type { ActionResult, DatabaseKey } from "./types";

function isValidStatus(options: { name: string }[], status: string) {
  return options.some((option) => option.name === status);
}

async function assertStatusExists(databaseKey: DatabaseKey, status: string) {
  const database = await retrieveDatabase(getDatabaseId(databaseKey));
  const options = schemaOptions(database, notionProperties.status);

  if (!isValidStatus(options, status)) {
    throw new Error(`Le statut "${status}" n'existe plus dans Notion pour cette base.`);
  }
}

export async function changeStatus(databaseKey: DatabaseKey, pageId: string, status: string): Promise<ActionResult> {
  await assertStatusExists(databaseKey, status);
  await updatePageProperties(pageId, {
    [notionProperties.status]: statusValue(status)
  });

  return { ok: true, message: "Statut mis a jour dans Notion." };
}

export async function createBrand(payload: {
  name: string;
  status?: string;
  niche?: string;
  target?: string;
  tone?: string;
  platformIds?: string[];
}): Promise<ActionResult> {
  if (!payload.name.trim()) {
    throw new Error("Le nom du compte est obligatoire.");
  }

  const database = await retrieveDatabase(getDatabaseId("brands"));
  const status = payload.status || (await firstStatusOrFallback("brands", "En cours"));

  await assertStatusExists("brands", status);

  const properties: Record<string, unknown> = {
    [notionProperties.title.brands]: titleValue(payload.name),
    [notionProperties.status]: statusValue(status)
  };

  // On ecrit uniquement dans les colonnes qui existent vraiment dans Notion.
  // Comme ca, si une propriete optionnelle change, la creation du compte reste plus robuste.
  const nicheProperty = firstExistingProperty(database, ["Details/Niche"]);
  const targetProperty = firstExistingProperty(database, ["Cible"]);
  const toneProperty = firstExistingProperty(database, ["Ton"]);
  const platformsProperty = firstExistingProperty(database, ["Réseau", "Reseau"]);

  if (nicheProperty) properties[nicheProperty] = richTextValue(payload.niche ?? "");
  if (targetProperty) properties[targetProperty] = richTextValue(payload.target ?? "");
  if (toneProperty) properties[toneProperty] = richTextValue(payload.tone ?? "");
  if (platformsProperty) properties[platformsProperty] = relationValue(payload.platformIds ?? []);

  await createDatabasePage(getDatabaseId("brands"), properties);

  return { ok: true, message: "Compte cree dans Notion." };
}

export async function createInputContent(payload: {
  title: string;
  details?: string;
  brandIds?: string[];
  sourceIds?: string[];
  externalUrl?: string;
  status?: string;
}): Promise<ActionResult> {
  const status = payload.status || (await firstStatusOrFallback("inputs", "New"));

  await assertStatusExists("inputs", status);
  await createDatabasePage(getDatabaseId("inputs"), {
    [notionProperties.title.inputs]: titleValue(payload.title),
    [notionProperties.status]: statusValue(status),
    Details: richTextValue(payload.details ?? ""),
    "[Brands]": relationValue(payload.brandIds ?? []),
    "[Competitors]": relationValue(payload.sourceIds ?? []),
    "userDefined:URL": urlValue(payload.externalUrl ?? "")
  });

  return { ok: true, message: "Inspiration creee dans Notion." };
}

export async function updateInputContent(payload: {
  pageId: string;
  title: string;
  details: string;
  brandIds: string[];
  sourceIds: string[];
  formats: string[];
  status?: string;
}): Promise<ActionResult> {
  if (!payload.title.trim()) {
    throw new Error("Le titre ne peut pas etre vide.");
  }

  const inputDatabase = await retrieveDatabase(getDatabaseId("inputs"));
  const formatType = inputDatabase.properties?.Format?.type;
  const formatProperty =
    formatType === "select"
      ? selectValue(payload.formats[0] ?? "")
      : multiSelectValue(payload.formats);

  const properties: Record<string, unknown> = {
    [notionProperties.title.inputs]: titleValue(payload.title),
    Details: richTextValue(payload.details),
    "[Brands]": relationValue(payload.brandIds),
    "[Competitors]": relationValue(payload.sourceIds),
    Format: formatProperty
  };

  if (payload.status) {
    await assertStatusExists("inputs", payload.status);
    properties[notionProperties.status] = statusValue(payload.status);
  }

  await updatePageProperties(payload.pageId, properties);

  return { ok: true, message: "Inspiration mise a jour dans Notion." };
}

export async function updateContentItem(payload: {
  pageId: string;
  title: string;
  status: string;
  brandIds: string[];
  format: string;
  script: string;
  description: string;
  canvaUrl: string;
  externalUrl: string;
}): Promise<ActionResult> {
  if (!payload.title.trim()) {
    throw new Error("Le titre ne peut pas etre vide.");
  }

  await assertStatusExists("contents", payload.status);
  const contentDatabase = await retrieveDatabase(getDatabaseId("contents"));
  const externalUrlProperty = firstExistingProperty(contentDatabase, ["userDefined:URL", "URL"]);

  const properties: Record<string, unknown> = {
    [notionProperties.title.contents]: titleValue(payload.title),
    [notionProperties.status]: statusValue(payload.status),
    Brand: relationValue(payload.brandIds),
    Format: selectValue(payload.format),
    "Poste/script": richTextValue(payload.script),
    "Description du post": richTextValue(payload.description),
    Canva: urlValue(payload.canvaUrl)
  };

  // Certaines bases Notion utilisent "URL", d'autres "userDefined:URL".
  // On ecrit seulement dans la propriete qui existe pour eviter une erreur 400.
  if (externalUrlProperty) {
    properties[externalUrlProperty] = urlValue(payload.externalUrl);
  }

  await updatePageProperties(payload.pageId, properties);

  return { ok: true, message: "Contenu mis a jour dans Notion." };
}

export async function createContentFromInput(payload: {
  inputId: string;
  title?: string;
  nextInputStatus?: string;
  contentStatus?: string;
  brandIds?: string[];
}): Promise<ActionResult> {
  const inputPage = await retrievePage(payload.inputId);
  const inputTitle = readTitle(inputPage, notionProperties.title.inputs);
  const inputBrandIds = inputPage.properties?.["[Brands]"]?.relation?.map((item: any) => item.id) ?? [];
  const contentBrandIds = payload.brandIds?.length ? payload.brandIds : inputBrandIds;
  const inputDetails = readRichText(inputPage, "Details");
  const inputScript = readRichText(inputPage, "Script");

  const contentStatus = payload.contentStatus || (await firstStatusOrFallback("contents", "Idées"));
  await assertStatusExists("contents", contentStatus);

  await createDatabasePage(getDatabaseId("contents"), {
    [notionProperties.title.contents]: titleValue(payload.title || inputTitle),
    [notionProperties.status]: statusValue(contentStatus),
    Brand: relationValue(contentBrandIds),
    Inspi: relationValue([payload.inputId]),
    "Poste/script": richTextValue(inputScript),
    "Description du post": richTextValue(inputDetails)
  });

  const nextInputStatus = payload.nextInputStatus || "Done";
  await assertStatusExists("inputs", nextInputStatus);
  await updatePageProperties(payload.inputId, {
    [notionProperties.status]: statusValue(nextInputStatus)
  });

  return { ok: true, message: "Contenu cree depuis l'inspiration." };
}

async function firstStatusOrFallback(databaseKey: DatabaseKey, fallback: string) {
  const database = await retrieveDatabase(getDatabaseId(databaseKey));
  const options = schemaOptions(database, notionProperties.status);
  return options.find((option) => option.name === fallback)?.name ?? options[0]?.name ?? fallback;
}

function readTitle(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.title?.map((item: any) => item.plain_text).join("") || "Sans titre";
}

function readRichText(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.rich_text?.map((item: any) => item.plain_text).join("") || "";
}

function firstExistingProperty(database: any, names: string[]) {
  return names.find((name) => Boolean(database.properties?.[name]));
}
