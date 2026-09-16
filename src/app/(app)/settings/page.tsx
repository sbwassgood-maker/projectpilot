import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { PageHeader } from "@/components/ui";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const aiConfigured =
    env.aiProvider === "mock" || env.openaiApiKey.length > 0;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and AI configuration" />
      <div className="max-w-2xl space-y-6 p-8">
        <section className="pp-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-foreground">
                {user?.name ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd className="font-medium text-foreground">{user?.email}</dd>
            </div>
          </dl>
        </section>

        <section className="pp-card p-6">
          <h2 className="text-sm font-semibold text-foreground">
            AI processing
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Provider</dt>
              <dd className="font-medium text-foreground">
                {env.aiProvider === "openai" ? "OpenAI" : "Local (mock)"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Model</dt>
              <dd className="font-medium text-foreground">
                {env.aiProvider === "openai" ? env.openaiModel : "deterministic"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Status</dt>
              <dd
                className="font-medium"
                style={{ color: aiConfigured ? "var(--ok)" : "var(--sev-high)" }}
              >
                {aiConfigured ? "Configured" : "Missing API key"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            AI keys are read server-side only from environment variables and are
            never exposed to the browser. Set <code>OPENAI_API_KEY</code> and{" "}
            <code>AI_PROVIDER=openai</code> in your environment to use OpenAI.
          </p>
        </section>
      </div>
    </div>
  );
}
