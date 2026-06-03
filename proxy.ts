import { NextResponse, type NextRequest } from "next/server";
import { authCookieName, isValidSessionToken } from "./lib/auth-session";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets/")
  );
}

export async function proxy(request: NextRequest) {
  const passwordIsConfigured = Boolean(process.env.CONTENT_OS_PASSWORD);

  // En local, si aucun mot de passe n'est configure, l'app reste ouverte.
  if (!passwordIsConfigured) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const isLoggedIn = await isValidSessionToken(request.cookies.get(authCookieName)?.value);

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPublicPath(pathname) || isLoggedIn) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, message: "Connexion requise." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\.).*)"]
};
