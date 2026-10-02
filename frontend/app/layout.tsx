import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import LangToggle from "@/components/LangToggle";

export const metadata: Metadata = { title: "NicheDesk Admin", description: "NicheDesk SaaS admin dashboard" };

const MOBILE_NAV = [
  { href: "/", label: "Overview" },
  { href: "/bots", label: "Bots" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/playground", label: "Playground" },
  { href: "/inbox", label: "Inbox" },
  { href: "/billing", label: "Billing" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==='dark'||(!localStorage.theme&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <header
              className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 md:px-6 py-3 backdrop-blur"
              style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 md:hidden">
                <span className="brand-mark" style={{ width: 30, height: 30, fontSize: 15 }}>N</span>
                <span className="font-bold">NicheDesk</span>
              </div>
              <p className="hidden md:block text-sm opacity-60">Welcome back — your bots replied instantly while you were away ✨</p>
              <div className="flex items-center gap-2">
                <span className="badge bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> All systems live
                </span>
                <Link href="/login" className="btn-ghost" style={{ minHeight: 36, padding: "0 14px", fontSize: 13, textDecoration: "none" }}>
                  Login
                </Link>
                <ThemeToggle />
                <LangToggle />
              </div>
            </header>
            <nav className="md:hidden flex gap-2 overflow-x-auto p-2 text-sm" style={{ borderBottom: "1px solid var(--border)" }} aria-label="Primary mobile">
              {MOBILE_NAV.map((n) => (
                <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 border" style={{ borderColor: "var(--border)" }}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <main className="mx-auto w-full max-w-6xl p-4 md:p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
