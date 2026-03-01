import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "vz_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/sw.js" ||
    pathname.startsWith("/manifest") ||
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/settings")
  ) {
    return NextResponse.next();
  }

  const has = req.cookies.get(COOKIE)?.value;
  if (!has) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!favicon.ico).*)"] };
