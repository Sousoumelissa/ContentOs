import { NextResponse } from "next/server";
import { changeStatus } from "@/lib/notion/mutations";
import type { DatabaseKey } from "@/lib/notion/types";

const allowedDatabases: DatabaseKey[] = ["brands", "inputs", "contents"];

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const database = body.database as DatabaseKey;

    if (!allowedDatabases.includes(database)) {
      return NextResponse.json({ message: "Base Notion non autorisee pour ce changement." }, { status: 400 });
    }

    if (!body.pageId || !body.status) {
      return NextResponse.json({ message: "pageId et status sont obligatoires." }, { status: 400 });
    }

    const result = await changeStatus(database, body.pageId, body.status);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Statut non modifie."
      },
      { status: 500 }
    );
  }
}
