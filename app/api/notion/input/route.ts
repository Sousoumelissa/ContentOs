import { NextResponse } from "next/server";
import { createInputContent, updateInputContent } from "@/lib/notion/mutations";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ ok: false, message: "Le titre est obligatoire." }, { status: 400 });
    }

    const result = await createInputContent({
      title: body.title,
      details: body.details,
      brandIds: body.brandIds,
      sourceIds: body.sourceIds,
      externalUrl: body.externalUrl,
      status: body.status
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Inspiration non creee."
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.pageId) {
      return NextResponse.json({ ok: false, message: "pageId est obligatoire." }, { status: 400 });
    }

    const result = await updateInputContent({
      pageId: body.pageId,
      title: body.title ?? "",
      details: body.details ?? "",
      brandIds: body.brandIds ?? [],
      sourceIds: body.sourceIds ?? [],
      formats: body.formats ?? [],
      status: body.status
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Inspiration non modifiee."
      },
      { status: 500 }
    );
  }
}
