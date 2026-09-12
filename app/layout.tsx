import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bera-ui.vercel.app"),
  openGraph: {
    type: "website",
    url: "https://bera-ui.vercel.app",
    siteName: "bera/ui",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "bera/ui — Every state, considered.",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  title: "bera/ui — Every state, considered.",
  description:
    "Reusable transitions for the interfaces you already have. Explore the motion, customize the details, and bring the source into your React project.",
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
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="describedby" href="/llms.txt" type="text/markdown" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
