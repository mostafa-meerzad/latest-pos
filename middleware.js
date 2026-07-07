import { NextResponse } from "next/server";
import { canAccess } from "./lib/permissions";
import { verifySessionToken, SESSION_COOKIE } from "./lib/auth";

/**
 * Define your application's routes and the permissions required.
 * `allow: true` means any authenticated user can access.
 */
const routePermissions = [
  // --- AUTH / STATIC (allowed immediately)
  { match: /^\/login(\/.*)?$/i, allow: true },
  { match: /^\/access-denied(\/.*)?$/i, allow: true },
  { match: /^\/api\/login(\/.*)?$/i, allow: true },
  { match: /^\/api\/logout(\/.*)?$/i, allow: true },

  // --- Admin-only restrictions
  { match: /^\/api\/users(\/.*)?$/i, action: "admin.only" },
  { match: /^\/settings(\/.*)?$/i, action: "admin.only" },

  // All other routes are allowed for any authenticated user (no specific action)
];

const signInPage = "/login";
const accessDeniedPage = "/access-denied";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  // extract our session token from cookies
  const cookieHeader = req.headers.get("cookie") || "";
  const cookie = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  const jwtToken = cookie ? decodeURIComponent(cookie.split("=")[1] || "") : null;
  const token = jwtToken ? await verifySessionToken(jwtToken) : null;

  const rule = routePermissions.find((r) => r.match.test(pathname));

  if (rule?.allow) {
    // If user is already authenticated and trying to view the login page,
    // send them to their intended destination (or home) instead of staying on /login
    if (pathname.startsWith("/login") && token) {
      const cb = req.nextUrl.searchParams.get("callbackUrl") || "/";
      let destUrl = new URL(cb, req.url);
      // Prevent open redirects: only allow same-origin
      if (destUrl.origin !== req.nextUrl.origin) {
        destUrl = new URL("/", req.url);
      }
      return NextResponse.redirect(destUrl);
    }
    return NextResponse.next();
  }

  // --- 2. Then, check for authentication
  if (!token) {
    // For API routes, return JSON error
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For page routes, redirect to sign-in
    const url = new URL(signInPage, req.url);
    url.searchParams.set("callbackUrl", req.url); // Preserve the intended destination
    return NextResponse.redirect(url);
  }
  
  // --- 3. Finally, check for permissions (now that we know the user is authenticated)
  if (rule?.action) {
    const userRole = token.role;
    if (!canAccess(userRole, rule.action)) {
      // For API routes, return JSON error
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // For page routes, rewrite to the access-denied page
      const url = new URL(accessDeniedPage, req.url);
      return NextResponse.rewrite(url, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except internal Next.js paths and static assets
  matcher: [
    "/((?!_next/static|_next/image|_next|favicon.ico|robots.txt|sitemap.xml|public).*)",
  ],
};
