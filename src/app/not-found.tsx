import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">
        404
      </p>
      <h1 className="text-2xl font-bold text-foreground">Not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page or resource you&apos;re looking for doesn&apos;t exist, or you
        don&apos;t have access to it.
      </p>
      <Link href="/dashboard" className="pp-btn pp-btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
