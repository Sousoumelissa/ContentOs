import type { BootstrapData, ContentItem, OptionColor } from "./notion/types";
import { normalize } from "./ui-helpers";

export type ProductionPhaseKey = "script" | "production" | "ready" | "scheduled" | "published" | "abandoned" | "unknown";
export type PriorityLevel = "green" | "yellow" | "orange" | "red";

export type ProductionPhase = {
  key: ProductionPhaseKey;
  label: string;
  color: OptionColor;
};

export type ContentAlert = {
  id: string;
  label: string;
  level: PriorityLevel;
};

export type ContentPriority = {
  level: PriorityLevel;
  label: string;
  weight: number;
  alerts: ContentAlert[];
};

const priorityWeights: Record<PriorityLevel, number> = {
  green: 0,
  yellow: 1,
  orange: 2,
  red: 3
};

// Regroupe les statuts Notion en phases de production plus lisibles.
// Les statuts restent dynamiques dans Notion : cette fonction ne fait que les interpreter.
export function getProductionPhase(content: ContentItem): ProductionPhase {
  const status = normalize(content.status);

  if (status.includes("abandon")) return { key: "abandoned", label: "Ecarte", color: "red" };
  if (status.includes("poste") || status.includes("publie")) return { key: "published", label: "Publie", color: "green" };
  if (status.includes("planifier")) return { key: "scheduled", label: "Programme", color: "yellow" };
  if (status.includes("ready") || status.includes("pret")) return { key: "ready", label: "Pret", color: "blue" };
  if (status.includes("script")) return { key: "script", label: "Script", color: "gray" };
  if (status.includes("product") || status.includes("image") || status.includes("description")) {
    return { key: "production", label: "Production", color: "purple" };
  }

  return { key: "unknown", label: content.status || "A classer", color: content.statusColor || "default" };
}

export function getContentAlerts(content: ContentItem, data?: BootstrapData): ContentAlert[] {
  const phase = getProductionPhase(content);
  const alerts: ContentAlert[] = [];
  const hasAsset = content.hasFiles || Boolean(content.canvaUrl) || content.sceneIds.length > 0;
  const isFinal = phase.key === "published" || phase.key === "abandoned";
  const dateIsPast = Boolean(content.date) && new Date(`${content.date}T23:59:59`).getTime() < Date.now();

  if (content.brandIds.length === 0) {
    alerts.push({ id: "missing-brand", label: "Compte non relie", level: "red" });
  }

  if (!content.format && !isFinal) {
    alerts.push({ id: "missing-format", label: "Format manquant", level: "orange" });
  }

  if (!content.script && ["script", "production", "ready", "scheduled"].includes(phase.key)) {
    alerts.push({ id: "missing-script", label: "Script manquant", level: "red" });
  }

  if (!content.description && ["production", "ready", "scheduled"].includes(phase.key)) {
    alerts.push({ id: "missing-description", label: "Description manquante", level: "orange" });
  }

  if (!hasAsset && ["production", "ready", "scheduled"].includes(phase.key)) {
    alerts.push({ id: "missing-asset", label: "Asset manquant", level: "orange" });
  }

  if (phase.key === "ready" && !content.date) {
    alerts.push({ id: "ready-no-date", label: "Pret sans date", level: "orange" });
  }

  if (phase.key === "scheduled" && !content.date) {
    alerts.push({ id: "scheduled-no-date", label: "Planifie sans date", level: "red" });
  }

  if (dateIsPast && phase.key !== "published" && phase.key !== "abandoned") {
    alerts.push({ id: "past-date", label: "Date passee non publiee", level: "red" });
  }

  if (content.platformIds.length === 0 && ["ready", "scheduled"].includes(phase.key)) {
    alerts.push({ id: "missing-platform", label: "Plateforme manquante", level: "yellow" });
  }

  if (content.inputIds.length === 0 && !isFinal) {
    alerts.push({ id: "missing-input", label: "Inspiration d'origine absente", level: "yellow" });
  }

  if (data && content.brandIds.some((brandId) => !data.pageTitles[brandId])) {
    alerts.push({ id: "unknown-brand", label: "Compte lie introuvable", level: "red" });
  }

  return alerts;
}

export function getContentPriority(content: ContentItem, data?: BootstrapData): ContentPriority {
  const alerts = getContentAlerts(content, data);
  const highest = alerts.reduce<PriorityLevel>((level, alert) => {
    return priorityWeights[alert.level] > priorityWeights[level] ? alert.level : level;
  }, "green");

  const labels: Record<PriorityLevel, string> = {
    red: "Urgent",
    orange: "A traiter",
    yellow: "A completer",
    green: "OK"
  };

  return {
    level: highest,
    label: labels[highest],
    weight: priorityWeights[highest],
    alerts
  };
}

export function sortByPriority<T extends ContentItem>(items: T[], data?: BootstrapData) {
  return [...items].sort((a, b) => {
    const priorityDiff = getContentPriority(b, data).weight - getContentPriority(a, data).weight;
    if (priorityDiff !== 0) return priorityDiff;

    const aDate = a.date || "9999-99-99";
    const bDate = b.date || "9999-99-99";
    const dateDiff = aDate.localeCompare(bDate);
    if (dateDiff !== 0) return dateDiff;

    return a.title.localeCompare(b.title);
  });
}

export function getPriorityCounts(items: ContentItem[], data?: BootstrapData) {
  return items.reduce(
    (counts, item) => {
      counts[getContentPriority(item, data).level] += 1;
      return counts;
    },
    { red: 0, orange: 0, yellow: 0, green: 0 } as Record<PriorityLevel, number>
  );
}
