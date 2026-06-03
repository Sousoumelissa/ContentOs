import { notionProperties } from "./config";
import {
  dateStartProp,
  hasFilesProp,
  multiSelectProp,
  relationIdsProp,
  selectOrMultiSelectProp,
  selectProp,
  statusProp,
  textProp,
  titleProp,
  urlProp
} from "./property-readers";
import type { Brand, ContentItem, InputContent, Platform, Source } from "./types";

function cleanId(page: any) {
  return page.id.replaceAll("-", "");
}

export function mapBrand(page: any): Brand {
  const status = statusProp(page, notionProperties.status);

  return {
    id: cleanId(page),
    url: page.url,
    name: titleProp(page, notionProperties.title.brands),
    status: status.name,
    statusColor: status.color,
    niche: textProp(page, "Details/Niche"),
    target: textProp(page, "Cible"),
    tone: textProp(page, "Ton"),
    ideaPrompt: textProp(page, "Prompt Idée"),
    scriptPrompt: textProp(page, "Prompt script"),
    imagePrompt: textProp(page, "Prompt  image"),
    platforms: relationIdsProp(page, "Réseau"),
    inputIds: relationIdsProp(page, "Lié à [Input Content] ([Brands])")
  };
}

export function mapSource(page: any): Source {
  return {
    id: cleanId(page),
    url: page.url,
    name: titleProp(page, notionProperties.title.sources),
    tags: multiSelectProp(page, "Étiquettes"),
    details: textProp(page, "Détails"),
    brandIds: relationIdsProp(page, "Media [BD]"),
    inputIds: relationIdsProp(page, "[Input Content]"),
    links: {
      url: urlProp(page, "URL") || urlProp(page, "userDefined:URL"),
      tiktok: urlProp(page, "Tiktok"),
      instagram: urlProp(page, "Insta"),
      youtube: urlProp(page, "Youtube"),
      pinterest: urlProp(page, "Pinterest"),
      website: urlProp(page, "Website")
    }
  };
}

export function mapInput(page: any): InputContent {
  const status = statusProp(page, notionProperties.status);

  return {
    id: cleanId(page),
    url: page.url,
    title: titleProp(page, notionProperties.title.inputs),
    status: status.name,
    statusColor: status.color,
    details: textProp(page, "Details"),
    script: textProp(page, "Script"),
    caption: textProp(page, "Legende"),
    formats: selectOrMultiSelectProp(page, "Format"),
    brandIds: relationIdsProp(page, "[Brands]"),
    accountName: textProp(page, "Compte lié") || textProp(page, "Compte") || textProp(page, "compte"),
    sourceIds: relationIdsProp(page, "[Competitors]"),
    externalUrl: urlProp(page, "URL") || urlProp(page, "userDefined:URL")
  };
}

export function mapContent(page: any): ContentItem {
  const status = statusProp(page, notionProperties.status);

  return {
    id: cleanId(page),
    url: page.url,
    title: titleProp(page, notionProperties.title.contents),
    status: status.name,
    statusColor: status.color,
    format: selectProp(page, "Format"),
    brandIds: relationIdsProp(page, "Brand"),
    platformIds: relationIdsProp(page, "Réseau"),
    inputIds: relationIdsProp(page, "Inspi"),
    sceneIds: relationIdsProp(page, "Scenes"),
    script: textProp(page, "Poste/script"),
    description: textProp(page, "Description du post"),
    canvaUrl: urlProp(page, "Canva"),
    externalUrl: urlProp(page, "URL") || urlProp(page, "userDefined:URL"),
    date: dateStartProp(page, "Date"),
    hasFiles: hasFilesProp(page, "Fichiers et médias")
  };
}

export function mapPlatform(page: any): Platform {
  return {
    id: cleanId(page),
    url: page.url,
    name: titleProp(page, notionProperties.title.platforms),
    brandIds: relationIdsProp(page, "Réseau"),
    contentIds: relationIdsProp(page, "Edito")
  };
}
