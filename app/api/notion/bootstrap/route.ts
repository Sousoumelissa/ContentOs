import { NextResponse } from "next/server";
import { getBootstrapData } from "@/lib/notion/queries";

export async function GET() {
  try {
    const data = await getBootstrapData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Impossible de charger les donnees Notion."
      },
      { status: 500 }
    );
  }
}
