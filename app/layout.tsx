import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = { title: "VZ-Karte", description: "Verkehrszeichen-Karte" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <Header />
        {children}
      </body>
    </html>
  );
}
