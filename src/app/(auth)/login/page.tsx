import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted">
        Welcome back. Enter your details to continue.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold"
          style={{ color: "var(--accent)" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
