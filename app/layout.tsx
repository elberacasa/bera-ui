import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bera/ui — Transitions, with feeling.",
  description:
    "Familiar interactions, exceptional motion. Explore reusable React transitions with slow playback, complete source, and instructions for your coding agent.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
