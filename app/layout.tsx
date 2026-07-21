import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outlio — Hands-on growth accelerator",
  description:
    "You build the product. We build the pipeline. Research-first, human-written outbound for tech startups, SaaS startups, and agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
