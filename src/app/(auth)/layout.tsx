import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      {/* Left: form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8" />
          {children}
        </div>
      </div>

      {/* Right: brand panel */}
      <div
        className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16"
        style={{ background: "#0f172a" }}
      >
        <div className="max-w-md text-white">
          <h2 className="text-2xl font-semibold leading-snug">
            Turn scattered project information into a trustworthy weekly report.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            ProjectPilot reads your emails, PDFs, spreadsheets and daily reports,
            builds a chronological project timeline, flags what needs attention,
            and drafts an evidence-backed weekly report — every claim linked to
            its source document.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent)" }}>✓</span>
              Evidence-backed intelligence, never unsupported guesses
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent)" }}>✓</span>
              Automatic timeline &amp; &ldquo;Needs Attention&rdquo; detection
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: "var(--accent)" }}>✓</span>
              Professional weekly reports in one click
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
