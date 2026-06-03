import type { BootstrapData, InputContent } from "./notion/types";
import { inputBrandName, normalize } from "./ui-helpers";

export type InputStatusCorrection = {
  targetStatus: "ToTranscript" | "ToComplet";
  reasons: string[];
};

const ignoredCorrectionStatuses = new Set(["done", "totranscript", "abandon", "erreur"]);

// Ces statuts ne sont jamais modifies par le correcteur automatique.
export function canAutoCorrectInputStatus(input: InputContent) {
  return !ignoredCorrectionStatuses.has(normalize(input.status));
}

// Regles metier pour ranger une inspiration selon les infos disponibles.
export function getInputStatusCorrection(data: BootstrapData, input: InputContent, fallbackBrandId = ""): InputStatusCorrection | null {
  if (!canAutoCorrectInputStatus(input)) return null;

  const hasTitle = Boolean(input.title.trim());
  const hasSourceLink = Boolean(input.externalUrl.trim());
  const hasAccount = Boolean(fallbackBrandId) || inputBrandName(data, input) !== "Non relie";
  const hasCompetitor = input.sourceIds.length > 0;
  const hasFormat = input.formats.length > 0;
  const hasDetails = Boolean(input.details.trim());

  if (!hasTitle && hasSourceLink) {
    return {
      targetStatus: "ToTranscript",
      reasons: ["titre manquant avec lien source"]
    };
  }

  const reasons: string[] = [];
  if (!hasAccount) reasons.push("compte manquant");
  if (!hasFormat) reasons.push("format manquant");
  if (!hasDetails) reasons.push("details manquants");
  if (!hasCompetitor && !hasAccount) reasons.push("ni competitor ni compte lie");

  return reasons.length > 0 ? { targetStatus: "ToComplet", reasons } : null;
}

export function inputStatusCorrectionMessage(correction: InputStatusCorrection) {
  return `Inspiration envoyee en ${correction.targetStatus} : ${correction.reasons.join(", ")}.`;
}

// Liste les infos minimum avant de transformer une inspiration en contenu.
// Si une info manque, on bloque la production et on envoie l'inspiration en ToComplet.
export function getInputProductionMissingFields(data: BootstrapData, input: InputContent, fallbackBrandId = "") {
  const correction = getInputStatusCorrection(data, input, fallbackBrandId);
  return correction?.targetStatus === "ToComplet" ? correction.reasons : [];
}

// Message clair affiche dans l'interface quand la production est bloquee.
export function inputNeedsCompletionMessage(missingFields: string[]) {
  return `Inspiration incomplete : ${missingFields.join(", ")}. Statut passe en ToComplet.`;
}
