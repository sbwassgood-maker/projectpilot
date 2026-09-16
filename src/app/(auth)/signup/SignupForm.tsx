"use client";

import { useActionState } from "react";
import { signupAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div>
        <label className="pp-label" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="pp-input"
          placeholder="Jane Contractor"
        />
      </div>
      <div>
        <label className="pp-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="pp-input"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label className="pp-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="pp-input"
          placeholder="At least 8 characters"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="pp-btn pp-btn-primary w-full disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
