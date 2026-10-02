"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: "◧" },
  { href: "/bots", label: "Bots", icon: "🤖" },
  { href: "/knowledge", label: "Knowledge", icon: "📚" },
  { href: "/playground", label: "Playground", icon: "🧪" },
  { href: "/appearance", label: "Appearance", icon: "🎨" },
  { href: "/install", label: "Install", icon: "⚙️" },
  { href: "/inbox", label: "Inbox", icon: "💬" },
  { href: "/leads", label: "Leads", icon: "🧲" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/billing", label: "Billing", icon: "💳" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside
      className="hidden md:flex w-60 shrink-0 flex-col gap-1 p-4"
      style={{ background: "var(--sidebar)" }}
      aria-label="Primary"
    >
      <Link href="/" className="flex items-center gap-2.5 px-2 py-3" style={{ minHeight: 44 }}>
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>
          <span className="block text-[17px] font-bold tracking-tight text-white leading-none">NicheDesk</span>
          <span className="block text-[11px] font-medium text-white/50 mt-1">AI Support Platform</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-1 mt-2">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <span aria-hidden="true" className="w-[18px] text-center">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl p-3.5 text-white" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <p className="text-[13px] font-semibold">🧪 Playground</p>
        <p className="text-xs text-white/60 mt-1 leading-relaxed">Test your bot before going live.</p>
        <Link
          href="/playground"
          className="mt-2.5 inline-flex items-center justify-center rounded-lg px-3 text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", minHeight: 36 }}
        >
          Try it →
        </Link>
      </div>
    </aside>
  );
}
