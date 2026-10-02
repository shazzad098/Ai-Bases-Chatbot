"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, PageHeader, EmptyState, Skeleton, UsageMeter } from "@/components/ui";
import { api, getSession, isAuthError } from "@/lib/api";

type Overview = {
  conversations: number;
  messages: number;
  resolution_rate: number;
  csat: number;
  top_questions: { q: string; count: number }[];
  unanswered: string[];
};

const DEMO: Overview = {
  conversations: 1284,
  messages: 4310,
  resolution_rate: 72,
  csat: 4.6,
  top_questions: [
    { q: "ডেলিভারি চার্জ কত?", count: 214 },
    { q: "Refund policy?", count: 167 },
    { q: "ক্যাশ অন ডেলিভারি আছে কি?", count: 141 },
    { q: "Course duration?", count: 98 },
    { q: "EMI available?", count: 76 },
  ],
  unanswered: ["refund policy outside Dhaka?", "বিকাশে পেমেন্ট কিভাবে করব?"],
};

export default function AnalyticsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [data, setData] = useState<Overview | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getSession();
    setLoggedIn(!!s);
    if (!s) return;
    api<Overview>("/analytics/overview")
      .then((r) => {
        setData(r);
        setDemo(false);
      })
      .catch((err) => {
        if (isAuthError(err)) {
          setLoggedIn(false);
          return;
        }
        setError("Live analytics লোড করা যায়নি — demo data দেখানো হচ্ছে।");
        setData(DEMO);
        setDemo(true);
      });
  }, []);

  if (loggedIn === false) {
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <PageHeader title="Analytics" sub="Resolution, CSAT, top questions." />
        <EmptyState
          title="Login প্রয়োজন"
          hint="Analytics দেখতে আগে workspace-এ login করুন।"
          action={<Link href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Go to login →</Link>}
        />
      </div>
    );
  }

  const kpis = data
    ? [
        { label: "Conversations", value: data.conversations.toLocaleString(), hint: `${data.messages.toLocaleString()} messages` },
        { label: "Resolution rate", value: `${Math.round(data.resolution_rate)}%`, hint: "resolved without human help" },
        { label: "CSAT", value: data.csat ? `${data.csat} / 5` : "—", hint: "customer satisfaction" },
        { label: "Unanswered", value: String(data.unanswered.length), hint: "needs knowledge attention" },
      ]
    : null;
  const maxQ = data && data.top_questions.length > 0 ? Math.max(...data.top_questions.map((t) => t.count)) : 1;
  const funnel = data
    ? [
        { label: "Asked", value: data.messages, pct: 100 },
        { label: "Answered", value: Math.round(data.messages * (data.resolution_rate / 100)), pct: Math.round(data.resolution_rate) },
        { label: "Handed off", value: data.unanswered.length, pct: data.messages ? Math.min(100, Math.round((data.unanswered.length / Math.max(1, data.messages)) * 100)) : 0 },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Analytics"
        sub={demo ? "Demo data — login করে live stats দেখুন।" : "How your bots are performing."}
        action={<span className="badge bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live</span>}
      />
      {error && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200" role="alert">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis
          ? kpis.map((k) => (
              <Card key={k.label} className="card-hover">
                <p className="text-sm opacity-70">{k.label}</p>
                <p className="text-[28px] font-bold mt-1 tracking-tight tabular-nums">{k.value}</p>
                <p className="text-xs opacity-50 mt-0.5">{k.hint}</p>
              </Card>
            ))
          : [0, 1, 2, 3].map((i) => (
              <Card key={i}><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-20 mt-2" /></Card>
            ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold mb-1">Resolution funnel</h2>
          <p className="text-xs opacity-60 mb-4">asked → answered → handed off</p>
          <div className="flex flex-col gap-3">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{f.label}</span>
                  <span className="tabular-nums opacity-70">{f.value.toLocaleString()} · {f.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${f.pct}%`, background: "linear-gradient(90deg,#6366F1,#8B5CF6)" }} />
                </div>
              </div>
            ))}
          </div>
          {data && <div className="mt-4"><UsageMeter used={Math.round(data.resolution_rate)} quota={100} label="Bot resolution goal" /></div>}
        </Card>
        <Card>
          <h2 className="font-semibold mb-1">Top questions</h2>
          <p className="text-xs opacity-60 mb-4">most asked by customers</p>
          {!data ? (
            <div className="flex flex-col gap-2"><Skeleton /><Skeleton /><Skeleton /></div>
          ) : data.top_questions.length === 0 ? (
            <p className="text-sm opacity-60">No questions yet — chat in Playground first.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.top_questions.map((t) => (
                <li key={t.q}>
                  <div className="flex justify-between text-sm mb-1 gap-2">
                    <span className="truncate font-medium">{t.q}</span>
                    <span className="tabular-nums opacity-70 shrink-0">×{t.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.max(4, Math.round((t.count / maxQ) * 100))}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold">Unanswered questions</h2>
          <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{data?.unanswered.length ?? 0} to fix</span>
        </div>
        <p className="text-xs opacity-60 mb-3">Add these to Knowledge to lift resolution rate.</p>
        {!data ? (
          <div className="flex flex-col gap-2"><Skeleton /><Skeleton /></div>
        ) : data.unanswered.length === 0 ? (
          <p className="text-sm opacity-60">🎉 Everything is answered — great coverage!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.unanswered.map((u, i) => (
              <li key={i} className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)" }}>
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs" style={{ background: "var(--primary-soft)" }}>❓</span>
                <span className="break-words">{u}</span>
                <Link href="/knowledge" className="ml-auto shrink-0 text-[13px] font-semibold" style={{ color: "var(--primary)" }}>Fix →</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
