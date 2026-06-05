import { NextResponse } from "next/server";
import { createBrand } from "@/lib/notion/mutations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ ok: false, message: "Le nom du compte est obligatoire." }, { status: 400 });
    }

    const result = await createBrand({
      name: body.name,
      status: body.status,
      niche: body.niche,
      target: body.target,
      tone: body.tone,
      platformIds: body.platformIds ?? []
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Compte non cree."
      },
      { status: 500 }
    );
  }
}
