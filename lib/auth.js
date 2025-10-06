import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs"

export const SESSION_COOKIE = "pos.session";
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev-secret-change-me";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function signSession(user) {
  // Minimal payload: id, username, role
  const payload = { id: user.id, username: user.username, role: user.role };
  // Do not set cookie Max-Age so session ends on browser close; JWT gets a safety exp
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(secretKey);
  return token;
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    return payload; // { id, username, role, iat, exp }
  } catch (e) {
    return null;
  }
}

export async function getAuthFromRequest(req) {
  // For middleware and route handlers in App Router
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = decodeURIComponent(match.split("=")[1] || "");
  const payload = await verifySessionToken(token);
  return payload;
}

export async function getAuthFromCookies() {
  // For server components / route handlers where next/headers is available
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export function buildSessionCookie(token) {
  // Session cookie: do NOT set Max-Age or Expires
  const isProd = process.env.NODE_ENV === "production";
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isProd ? "Secure" : undefined,
  ].filter(Boolean);
  return attrs.join("; ");
}

export function buildClearSessionCookie() {
  const isProd = process.env.NODE_ENV === "production";
  const attrs = [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; ${isProd ? "Secure; " : ""}Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ];
  return attrs.join("; ");
}

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}