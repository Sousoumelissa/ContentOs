import { NextResponse } from "next/server";
import { authCookieName, authSessionMaxAge, createSessionToken } from "@/lib/auth-session";

export async function POST(request: Request) {
  const expectedPassword = process.env.CONTENT_OS_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { ok: false, message: "Mot de passe non configure. Ajoute CONTENT_OS_PASSWORD dans .env.local." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { password?: string };

  if (body.password !== expectedPassword) {
    return NextResponse.json({ ok: false, message: "Mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, message: "Connexion reussie." });
  response.cookies.set(authCookieName, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: authSessionMaxAge,
    path: "/"
  });

  return response;
}
