import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted">
        Start turning project documents into weekly reports.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold"
          style={{ color: "var(--accent)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
