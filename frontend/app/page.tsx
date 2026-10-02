"use client";
import { useEffect, useState } from "react";
import { Card, Skeleton } from "@/components/ui";
import { api, mockFallbacks } from "@/lib/api";
import { getLang, t, type Lang } from "@/lib/i18n";

const CHECKS = ["Create bot", "Add knowledge source", "Customize appearance", "Test in playground", "Install widget", "Invite teammate"];
const UNANSWERED = ["refund policy outside Dhaka?", "বিকাশে পেমেন্ট কিভাবে করব?", "course certificate valid?", "EMI available?"];

export default function OverviewPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [kpis, setKpis] = useState<typeof mockFallbacks.kpis | null>(null);
  const [done, setDone] = useState<boolean[]>([true, true, false, false, false, false]);
  useEffect(() => {
    setLang(getLang());
    const h = (e: Event) => setLang((e as CustomEvent<Lang>).detail);
    window.addEventListener("nichedesk-lang", h);
    api<typeof mockFallbacks.kpis>("/analytics/kpis", {}, mockFallbacks.kpis).then(setKpis);
    return () => window.removeEventListener("nichedesk-lang", h);
  }, []);
  const pct = Math.round((done.filter(Boolean).length / done.length) * 100);
  const cards = [
    { k: "conversations" as const, v: kpis?.conversations ?? "…" },
    { k: "resolution" as const, v: kpis ? `${Math.round(kpis.resolution * 100)}%` : "…" },
    { k: "csat" as const, v: kpis?.csat ?? "…" },
    { k: "leads" as const, v: kpis?.leads ?? "…" }
  ];
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t(lang, "overview")}</h1>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.k}><p className="text-sm opacity-70">{t(lang, c.k)}</p>
            {kpis ? <p className="text-2xl font-bold mt-1">{c.v}</p> : <Skeleton className="h-8 w-20 mt-2" />}
          </Card>
        ))}
      </div>
      <Card><p className="text-sm opacity-70 mb-2">Trend (placeholder — connect /analytics/timeseries)</p>
        <div className="flex h-24 items-end gap-1" aria-hidden="true">
          {[40, 55, 45, 70, 60, 80, 75].map((h, i) => <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />)}
        </div>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="flex justify-between items-center mb-2"><h2 className="font-semibold">{t(lang, "setupChecklist")}</h2><span className="text-sm">{pct}%</span></div>
          <div className="h-2 rounded bg-black/10 dark:bg-white/10 mb-3"><div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} /></div>
          <ul className="flex flex-col gap-1">
            {CHECKS.map((c, i) => (
              <li key={c}><label className="flex items-center gap-2 min-h-[44px] cursor-pointer text-sm">
                <input type="checkbox" className="h-5 w-5 accent-[#4F46E5]" checked={done[i]} onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} />{c}
              </label></li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold mb-2">{t(lang, "topUnanswered")}</h2>
          <ul className="flex flex-col gap-2 text-sm">{UNANSWERED.map((u) => <li key={u} className="rounded border p-2" style={{ borderColor: "var(--border)" }}>{u}</li>)}</ul>
        </Card>
      </div>
    </div>
  );
}
