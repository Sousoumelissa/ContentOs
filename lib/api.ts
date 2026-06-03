import type { BootstrapData, DatabaseKey } from "./notion/types";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Action impossible.");
  }

  return payload as T;
}

export async function fetchBootstrap() {
  const response = await fetch("/api/notion/bootstrap", { cache: "no-store" });
  return parseJsonResponse<BootstrapData>(response);
}

export async function patchStatus(database: DatabaseKey, pageId: string, status: string) {
  const response = await fetch("/api/notion/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ database, pageId, status })
  });

  return parseJsonResponse<{ ok: boolean; message: string }>(response);
}

export async function postInput(payload: {
  title: string;
  details?: string;
  brandIds?: string[];
  sourceIds?: string[];
  externalUrl?: string;
  status?: string;
}) {
  const response = await fetch("/api/notion/input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ ok: boolean; message: string }>(response);
}

export async function patchInput(payload: {
  pageId: string;
  title: string;
  details: string;
  brandIds: string[];
  sourceIds: string[];
  formats: string[];
  status?: string;
}) {
  const response = await fetch("/api/notion/input", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ ok: boolean; message: string }>(response);
}

export async function postContentFromInput(inputId: string, nextInputStatus = "Done", brandIds: string[] = []) {
  const response = await fetch("/api/notion/content/from-input", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputId, nextInputStatus, brandIds })
  });

  return parseJsonResponse<{ ok: boolean; message: string }>(response);
}

export async function patchContent(payload: {
  pageId: string;
  title: string;
  status: string;
  brandIds: string[];
  format: string;
  script: string;
  description: string;
  canvaUrl: string;
  externalUrl: string;
}) {
  const response = await fetch("/api/notion/content", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ ok: boolean; message: string }>(response);
}

export async function postProductionAutomation(payload: { brandId?: string; inputIds: string[] }) {
  const response = await fetch("/api/automation/production", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse<{ ok: boolean; message: string }>(response);
}
