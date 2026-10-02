"use client";
import { useEffect, useState } from "react";
import { getLang, setLang, type Lang } from "@/lib/i18n";
export default function LangToggle() {
  const [lang, setL] = useState<Lang>("en");
  useEffect(() => { setL(getLang()); }, []);
  return (
    <button aria-label="Toggle language EN/BN" className="rounded border px-3 min-h-[44px] text-sm" style={{ borderColor: "var(--border)" }}
      onClick={() => { const n: Lang = lang === "en" ? "bn" : "en"; setLang(n); setL(n); }}>
      {lang === "en" ? "বাংলা" : "English"}
    </button>
  );
}
