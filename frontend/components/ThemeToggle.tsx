"use client";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  return (
    <button aria-label="Toggle dark mode" className="rounded border px-3 min-h-[44px] text-sm" style={{ borderColor: "var(--border)" }}
      onClick={() => {
        const el = document.documentElement; const d = !el.classList.contains("dark");
        el.classList.toggle("dark", d); try { localStorage.theme = d ? "dark" : "light"; } catch {} setDark(d);
      }}>{dark ? "☀ Light" : "🌙 Dark"}</button>
  );
}
