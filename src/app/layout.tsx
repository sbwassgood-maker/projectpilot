import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectPilot — AI construction project intelligence",
  description:
    "Turn scattered construction project information into an evidence-backed timeline, attention items, and professional weekly reports.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
