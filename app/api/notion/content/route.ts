import { NextResponse } from "next/server";
import { updateContentItem } from "@/lib/notion/mutations";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.pageId) {
      return NextResponse.json({ ok: false, message: "pageId est obligatoire." }, { status: 400 });
    }

    const result = await updateContentItem({
      pageId: body.pageId,
      title: body.title ?? "",
      status: body.status ?? "",
      brandIds: body.brandIds ?? [],
      format: body.format ?? "",
      script: body.script ?? "",
      description: body.description ?? "",
      canvaUrl: body.canvaUrl ?? "",
      externalUrl: body.externalUrl ?? ""
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Contenu non modifie."
      },
      { status: 500 }
    );
  }
}
