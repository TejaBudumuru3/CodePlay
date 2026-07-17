import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Check for NextAuth session token (JWT strategy)
  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  const isLoggedIn = !!token;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiAuth = pathname.startsWith("/api/auth");
  const isLandingPage = pathname === "/";
  const isProtected = pathname.startsWith("/builder") || pathname.startsWith("/api/chat") || pathname.startsWith("/api/sessions") || pathname.startsWith("/api/stream") || pathname.startsWith("/api/credits");

  // Always allow: static assets, auth API, landing page
  if (isApiAuth || isLandingPage) {
    return NextResponse.next();
  }

  // Protect builder and API routes — redirect to login
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect authenticated users away from login page → builder
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/builder", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
