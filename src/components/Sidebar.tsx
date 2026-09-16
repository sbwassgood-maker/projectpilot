"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/documents", label: "Documents", icon: DocumentsIcon },
  { href: "/reports", label: "Reports", icon: ReportsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({
  user,
  onLogout,
}: {
  user: { name: string | null; email: string };
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={
                active
                  ? { background: "rgba(217,119,6,0.10)", color: "var(--accent-hover)" }
                  : { color: "var(--muted)" }
              }
            >
              <Icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name ?? "Account"}
          </p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="pp-btn pp-btn-secondary w-full justify-start text-muted"
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </aside>
  );
}

type IconProps = { active?: boolean };
const stroke = (active?: boolean) =>
  active ? "var(--accent-hover)" : "currentColor";

function DashboardIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" stroke={stroke(active)} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function ProjectsIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={stroke(active)} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function DocumentsIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={stroke(active)} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke={stroke(active)} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function ReportsIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={stroke(active)} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke={stroke(active)} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function SettingsIcon({ active }: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={stroke(active)} strokeWidth="1.6" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke={stroke(active)} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M15 12H4m0 0 4-4m-4 4 4 4M9 4h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
