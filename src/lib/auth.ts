import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { prisma } from "./db";

// ---------------------------------------------------------------------------
// Authentication
//
// Credentials auth with bcrypt-hashed passwords and a signed JWT stored in an
// httpOnly, sameSite cookie. Secrets are read server-side only (env.ts).
// ---------------------------------------------------------------------------

const COOKIE_NAME = "pp_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

type JwtPayload = {
  sub: string;
  email: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function signSession(payload: JwtPayload): string {
  return jwt.sign(payload, env.authSecret, {
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
}

export async function createSessionCookie(user: {
  id: string;
  email: string;
}): Promise<void> {
  const token = signSession({ sub: user.id, email: user.email });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Returns the authenticated user or null. Verifies the JWT signature and that
// the user still exists.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.authSecret) as JwtPayload;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.sub },
    select: { id: true, email: true, name: true },
  });
  return user ?? null;
}

// Throws if unauthenticated. Use in server actions / route handlers that
// require a logged-in user.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Not authenticated");
  }
  return user;
}

export class AuthError extends Error {}

// For use in pages / server components: redirects to /login instead of
// throwing when unauthenticated (avoids error-boundary noise on public hits).
export async function requireUserOrRedirect(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login"); // throws (never returns)
    throw new AuthError("Not authenticated");
  }
  return user;
}
