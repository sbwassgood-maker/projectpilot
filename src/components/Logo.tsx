export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-md text-white"
        style={{ background: "var(--accent)" }}
        aria-hidden
      >
        {/* Simple hard-hat / building mark */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-5h6v5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Project<span style={{ color: "var(--accent)" }}>Pilot</span>
      </span>
    </div>
  );
}
