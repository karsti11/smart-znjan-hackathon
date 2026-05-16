import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { RoleProvider } from "@/lib/role-context";

export const metadata: Metadata = {
  title: "Smart Žnjan · Grad Split",
  description:
    "Pametno upravljanje područjem Žnjana — parking, sportski tereni, komunalne prijave, loyalty, rasvjeta i navodnjavanje.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className="dark">
      <body className="font-sans">
        <RoleProvider>
          <div className="sea-sheen" />
          <Header />
          <main className="relative z-[1] mx-auto max-w-7xl px-6 py-8">{children}</main>
          <footer className="relative z-[1] mx-auto max-w-7xl px-6 py-10 text-center text-xs text-ink-200/50">
            Smart Žnjan · prototip · {new Date().getFullYear()}
          </footer>
        </RoleProvider>
      </body>
    </html>
  );
}
