import { NextResponse } from "next/server";

type ProductionAutomationPayload = {
  brandId?: string;
  inputIds?: string[];
};

export async function POST(request: Request) {
  const webhookUrl = process.env.PRODUCTION_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Webhook non configure. Ajoute PRODUCTION_WEBHOOK_URL dans .env.local pour activer ce bouton."
      },
      { status: 400 }
    );
  }

  try {
    const payload = (await request.json()) as ProductionAutomationPayload;

    // Le webhook recoit le contexte, mais l'automatisation peut quand meme
    // choisir de chercher elle-meme toutes les inspirations en statut Validate.
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "content-os",
        action: "production_batch",
        brandId: payload.brandId ?? null,
        inputIds: payload.inputIds ?? []
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: `Webhook refuse : ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: "Automatisation lancee pour les inspirations Validate." });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Webhook impossible a lancer."
      },
      { status: 500 }
    );
  }
}
