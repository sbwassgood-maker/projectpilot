"use client";

import { Sidebar } from "./Sidebar";

export function AppShell({
  user,
  logoutAction,
  children,
}: {
  user: { name: string | null; email: string };
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={() => void logoutAction()} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
