"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSessionCookie,
  destroySessionCookie,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/schemas/auth";

export type AuthActionState = { error: string | null };

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true },
  });

  await createSessionCookie(user);
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-ish behavior: always run a compare to reduce user enumeration.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinva");

  if (!user || !ok) {
    return { error: "Invalid email or password." };
  }

  await createSessionCookie({ id: user.id, email: user.email });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
