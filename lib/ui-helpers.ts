import type { BootstrapData, Brand, ContentItem, InputContent } from "./notion/types";

export function nameFor(data: BootstrapData, id: string) {
  return data.pageTitles[id] ?? "Non relie";
}

export function firstNameFor(data: BootstrapData, ids: string[]) {
  return ids.length ? nameFor(data, ids[0]) : "Non relie";
}

export function includesQuery(parts: Array<string | undefined>, query: string) {
  const q = query.trim().toLowerCase();
  return !q || parts.join(" ").toLowerCase().includes(q);
}

export function isPublished(item: ContentItem) {
  return normalize(item.status).includes("poste") || normalize(item.status).includes("publie");
}

export function isReady(item: ContentItem) {
  return normalize(item.status).includes("prete") || normalize(item.status).includes("planifier");
}

export function inputBelongsToBrand(input: InputContent, brand: Brand, data: BootstrapData) {
  if (input.brandIds.includes(brand.id)) return true;

  const formulaAccount = normalize(input.accountName);
  if (idsMatch(input.accountName, brand.id)) return true;
  if (formulaAccount && formulaAccount.includes(normalize(brand.name))) return true;

  return input.sourceIds.some((sourceId) => {
    const source = data.sources.find((item) => item.id === sourceId);
    return source?.brandIds.includes(brand.id) ?? false;
  });
}

export function inputBrandName(data: BootstrapData, input: InputContent) {
  if (input.brandIds.length) return firstNameFor(data, input.brandIds);

  const formulaBrand = data.brands.find((brand) => idsMatch(input.accountName, brand.id));
  if (formulaBrand) return formulaBrand.name;
  if (input.accountName) return input.accountName;

  const sourceBrandId = input.sourceIds
    .map((sourceId) => data.sources.find((source) => source.id === sourceId))
    .find((source) => source && source.brandIds.length > 0)?.brandIds[0];

  return sourceBrandId ? nameFor(data, sourceBrandId) : "Non relie";
}

export function inputBrandId(data: BootstrapData, input: InputContent) {
  if (input.brandIds.length) return input.brandIds[0];

  const formulaBrand = data.brands.find((brand) => idsMatch(input.accountName, brand.id) || normalize(input.accountName).includes(normalize(brand.name)));
  if (formulaBrand) return formulaBrand.id;

  const sourceBrandId = input.sourceIds
    .map((sourceId) => data.sources.find((source) => source.id === sourceId))
    .find((source) => source && source.brandIds.length > 0)?.brandIds[0];

  return sourceBrandId ?? "";
}

export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Compare les IDs Notion avec ou sans tirets, car Notion peut exposer les deux formats.
export function normalizeNotionId(value: string) {
  return value.replaceAll("-", "").trim().toLowerCase();
}

export function idsMatch(value: string, notionId: string) {
  const normalizedValue = normalizeNotionId(value);
  const normalizedId = normalizeNotionId(notionId);

  return Boolean(normalizedValue && normalizedId && normalizedValue.includes(normalizedId));
}
