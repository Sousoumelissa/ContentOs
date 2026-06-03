import type { NotionOption, OptionColor } from "./types";

export function pageIdFromUrl(url: string) {
  const raw = url.split("/").pop()?.split("?")[0] ?? "";
  return raw.replaceAll("-", "").slice(-32);
}

export function richTextToPlainText(value: any) {
  if (!value) return "";

  if (value.type === "title") {
    return value.title?.map((item: any) => item.plain_text).join("") ?? "";
  }

  if (value.type === "rich_text") {
    return value.rich_text?.map((item: any) => item.plain_text).join("") ?? "";
  }

  if (value.type === "formula") {
    const formula = value.formula;
    if (formula?.type === "string") return formula.string ?? "";
    if (formula?.type === "number") return String(formula.number ?? "");
    if (formula?.type === "boolean") return formula.boolean ? "Oui" : "Non";
    if (formula?.type === "date") return formula.date?.start ?? "";
  }

  if (value.type === "rollup") {
    const rollup = value.rollup;
    if (rollup?.type === "array") {
      return rollup.array
        ?.map((item: any) => richTextToPlainText(item) || item.title?.map((part: any) => part.plain_text).join("") || item.plain_text || item.name || "")
        .filter(Boolean)
        .join(", ") ?? "";
    }
    if (rollup?.type === "number") return String(rollup.number ?? "");
    if (rollup?.type === "date") return rollup.date?.start ?? "";
  }

  if (value.type === "select") {
    return value.select?.name ?? "";
  }

  if (value.type === "status") {
    return value.status?.name ?? "";
  }

  if (value.type === "multi_select") {
    return value.multi_select?.map((item: any) => item.name).join(", ") ?? "";
  }

  return "";
}

export function titleProp(page: any, propertyName: string) {
  return richTextToPlainText(page.properties?.[propertyName]);
}

export function textProp(page: any, propertyName: string) {
  return richTextToPlainText(page.properties?.[propertyName]);
}

export function statusProp(page: any, propertyName: string) {
  const status = page.properties?.[propertyName]?.status;
  return {
    name: status?.name ?? "",
    color: (status?.color ?? "default") as OptionColor
  };
}

export function selectProp(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.select?.name ?? "";
}

export function multiSelectProp(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.multi_select?.map((item: any) => item.name) ?? [];
}

export function selectOrMultiSelectProp(page: any, propertyName: string) {
  const property = page.properties?.[propertyName];

  if (property?.type === "select") {
    return property.select?.name ? [property.select.name] : [];
  }

  return property?.multi_select?.map((item: any) => item.name) ?? [];
}

export function urlProp(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.url ?? "";
}

export function relationIdsProp(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.relation?.map((item: any) => item.id.replaceAll("-", "")) ?? [];
}

export function dateStartProp(page: any, propertyName: string) {
  return page.properties?.[propertyName]?.date?.start ?? "";
}

export function hasFilesProp(page: any, propertyName: string) {
  const files = page.properties?.[propertyName]?.files ?? [];
  return files.length > 0;
}

export function schemaOptions(database: any, propertyName: string): NotionOption[] {
  const property = database.properties?.[propertyName];
  const options = property?.status?.options ?? property?.select?.options ?? property?.multi_select?.options ?? [];

  return options.map((option: any) => ({
    id: option.id,
    name: option.name,
    color: (option.color ?? "default") as OptionColor
  }));
}

export function relationValue(pageIds: string[]) {
  return {
    relation: pageIds.map((id) => ({ id }))
  };
}

export function titleValue(text: string) {
  return {
    title: [{ text: { content: text || "Sans titre" } }]
  };
}

export function richTextValue(text: string) {
  return {
    rich_text: text ? [{ text: { content: text } }] : []
  };
}

export function statusValue(status: string) {
  return {
    status: { name: status }
  };
}

export function urlValue(url: string) {
  return {
    url: url || null
  };
}

export function multiSelectValue(values: string[]) {
  return {
    multi_select: values.map((name) => ({ name }))
  };
}

export function selectValue(value: string) {
  return {
    select: value ? { name: value } : null
  };
}
