import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Friend Ledger",
  description: "Track money lent between friends, with confirmation from both sides.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
