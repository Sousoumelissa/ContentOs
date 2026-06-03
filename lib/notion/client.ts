import { getNotionToken } from "./config";

const NOTION_VERSION = "2022-06-28";
const API_BASE = "https://api.notion.com/v1";

type NotionRequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

export async function notionRequest<T>(path: string, options: NotionRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${getNotionToken()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    // On evite de garder des donnees Notion trop longtemps cote serveur.
    cache: "no-store"
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Erreur Notion ${response.status}: ${details}`);
  }

  return response.json() as Promise<T>;
}

export async function queryAllDatabasePages(databaseId: string) {
  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await notionRequest(`/databases/${databaseId}/query`, {
      method: "POST",
      body: {
        page_size: 100,
        start_cursor: cursor
      }
    });

    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}

export function retrieveDatabase(databaseId: string) {
  return notionRequest<any>(`/databases/${databaseId}`);
}

export function retrievePage(pageId: string) {
  return notionRequest<any>(`/pages/${pageId}`);
}

export function updatePageProperties(pageId: string, properties: Record<string, unknown>) {
  return notionRequest<any>(`/pages/${pageId}`, {
    method: "PATCH",
    body: { properties }
  });
}

export function createDatabasePage(databaseId: string, properties: Record<string, unknown>) {
  return notionRequest<any>("/pages", {
    method: "POST",
    body: {
      parent: { database_id: databaseId },
      properties
    }
  });
}
