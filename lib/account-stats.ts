import { getProductionPhase } from "./production-insights";
import { inputBelongsToBrand } from "./ui-helpers";
import type { BootstrapData, Brand } from "./notion/types";

export type AccountStats = {
  inputs: number;
  toProcess: number;
  production: number;
  ready: number;
  published: number;
  readyOrPublished: number;
  sources: number;
};

// Stats partagees pour toutes les vues Compte.
// Si une regle change ici, elle change partout ou les stats du compte sont affichees.
export function getAccountStats(account: Brand, data: BootstrapData): AccountStats {
  const inputs = data.inputs.filter((input) => inputBelongsToBrand(input, account, data));
  const inputIds = new Set(inputs.map((input) => input.id));
  const contents = data.contents.filter((content) => content.brandIds.includes(account.id));
  const sources = data.sources.filter((source) => source.brandIds.includes(account.id) || source.inputIds.some((inputId) => inputIds.has(inputId)));

  const production = contents.filter((content) => ["script", "production"].includes(getProductionPhase(content).key)).length;
  const ready = contents.filter((content) => ["ready", "scheduled"].includes(getProductionPhase(content).key)).length;
  const published = contents.filter((content) => getProductionPhase(content).key === "published").length;

  return {
    inputs: inputs.length,
    toProcess: inputs.filter((input) => !["Done", "Abandon"].includes(input.status)).length,
    production,
    ready,
    published,
    readyOrPublished: ready + published,
    sources: sources.length
  };
}
