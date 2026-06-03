import { NextResponse } from "next/server";
import { createContentFromInput } from "@/lib/notion/mutations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.inputId) {
      return NextResponse.json({ ok: false, message: "inputId est obligatoire." }, { status: 400 });
    }

    const result = await createContentFromInput({
      inputId: body.inputId,
      title: body.title,
      nextInputStatus: body.nextInputStatus,
      contentStatus: body.contentStatus,
      brandIds: body.brandIds ?? []
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Contenu non cree."
      },
      { status: 500 }
    );
  }
}
