"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, Button, ChatBubble, PageHeader, Badge, EmptyState } from "@/components/ui";
import { API_BASE, apiStrict, getSession, isAuthError } from "@/lib/api";

type Msg = { role: "user" | "bot"; text: string; time: string };
type Bot = { id: string; name: string; niche: string; public_key: string };
type Turn = {
  answer: string;
  sources: { chunk_id?: string; source_id?: string; score?: number }[];
  confidence: number;
  intent: string;
  lang: string;
  handoff: boolean;
  handoff_reason: string | null;
};

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function PlaygroundPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [botId, setBotId] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [last, setLast] = useState<Turn | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getSession();
    setLoggedIn(!!s);
    if (!s) return;
    apiStrict<{ bots: Bot[] }>("/bots")
      .then((r) => {
        setBots(r.bots);
        if (r.bots.length > 0) {
          setBotId(r.bots[0].id);
          setMsgs([{ role: "bot", text: `Hello! I'm ${r.bots[0].name} — ask me anything. 👇`, time: now() }]);
        }
      })
      .catch((err) => {
        // Expired/invalid token → session already cleared by api(); show login.
        if (isAuthError(err)) {
          setLoggedIn(false);
          return;
        }
        setLoadError(`Backend-এর সাথে যোগাযোগ করা যাচ্ছে না (${API_BASE})। Terminal-এ চালান: cd backend → python -m uvicorn app.main:app --reload --port 8000`);
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  async function createDemoBot() {
    setCreating(true);
    setLoadError("");
    try {
      const b = await apiStrict<{ id: string; name: string; niche: string; public_key: string }>("/bots", {
        method: "POST",
        body: JSON.stringify({ name: "Shop Assistant", niche: "ecommerce" }),
      });
      const nb: Bot = { id: b.id, name: b.name, niche: b.niche, public_key: b.public_key };
      // Load sample FAQs so the bot answers instantly.
      await apiStrict("/knowledge/seed-demo", {
        method: "POST",
        body: JSON.stringify({ bot_id: b.id, niche: "ecommerce" }),
      });
      setBots([nb]);
      setBotId(nb.id);
      setMsgs([{ role: "bot", text: `Hello! I'm ${nb.name} — I loaded sample FAQs. Try "How do I track my order?" 👇`, time: now() }]);
    } catch {
      setLoadError("Bot তৈরি করা যায়নি — backend চালু আছে কিনা দেখুন।");
    } finally {
      setCreating(false);
    }
  }

  async function send() {
    const message = q.trim();
    if (!message || loading || !botId) return;
    setQ("");
    setSendError("");
    setMsgs((m) => [...m, { role: "user", text: message, time: now() }]);
    setLoading(true);
    try {
      const r = await apiStrict<Turn>("/playground/chat", {
        method: "POST",
        body: JSON.stringify({ bot_id: botId, message }),
      });
      setLast(r);
      setMsgs((m) => [...m, { role: "bot", text: r.answer, time: now() }]);
    } catch (err) {
      if (isAuthError(err)) {
        setLoggedIn(false);
        return;
      }
      setSendError("পাঠানো যায়নি — backend চালু আছে কিনা দেখুন, অথবা আবার login করুন।");
    } finally {
      setLoading(false);
    }
  }

  if (loggedIn === false) {
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <PageHeader title="Playground" sub="Test your bot exactly as customers will see it." />
        <EmptyState
          title="Login প্রয়োজন"
          hint="Playground আসল backend ব্যবহার করে — আগে workspace-এ login করুন।"
          action={<Link href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Go to login →</Link>}
        />
      </div>
    );
  }

  const conf = last ? Math.round(last.confidence * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Playground"
        sub="Live backend test — answers come from your knowledge base, not mocks."
        action={
          <select
            className="input"
            style={{ width: "auto", minWidth: 180 }}
            aria-label="Select bot"
            value={botId}
            onChange={(e) => {
              setBotId(e.target.value);
              const b = bots.find((x) => x.id === e.target.value);
              setLast(null);
              setMsgs([{ role: "bot", text: b ? `Hello! I'm ${b.name} — ask me anything. 👇` : "Select a bot.", time: now() }]);
            }}
          >
            {bots.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.niche})</option>
            ))}
          </select>
        }
      />
      {loadError && (
        <p className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {loadError}
        </p>
      )}
      {!loadError && loggedIn && bots.length === 0 && (
        <Card>
          <EmptyState
            title="কোনো bot নেই"
            hint="প্রথমে একটা bot বানান — তারপর Knowledge-এ তথ্য দিয়ে Playground-এ টেস্ট করুন।"
            action={<Button onClick={createDemoBot} loading={creating}>+ Create demo bot</Button>}
          />
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="brand-mark" style={{ width: 34, height: 34, fontSize: 16 }}>N</span>
            <div>
              <p className="font-semibold text-sm leading-tight">{bots.find((b) => b.id === botId)?.name ?? "…"}</p>
              <p className="text-xs opacity-60 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Online · replies instantly
              </p>
            </div>
            {last?.handoff && <span className="ml-auto"><Badge status="Processing" /></span>}
          </div>
          <div ref={scrollRef} className="chat-scroll flex flex-col gap-3 px-5 py-4 h-[380px] overflow-y-auto" aria-live="polite">
            {msgs.map((m, i) => (
              <ChatBubble key={i} role={m.role} text={m.text} time={m.time} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="card rounded-2xl rounded-bl-md typing-dots" aria-label="Bot is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>
          {sendError && (
            <p className="mx-4 mb-1 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-[13px] text-red-700 dark:text-red-300" role="alert">
              {sendError}
            </p>
          )}
          <form
            className="px-4 pt-2 pb-1.5"
            style={{ borderTop: "1px solid var(--border)" }}
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                className="input py-2.5"
                style={{ minHeight: 44, maxHeight: 120 }}
                rows={1}
                aria-label="Ask something"
                placeholder="Ask something… (Enter to send)"
                value={q}
                disabled={!botId}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button type="submit" loading={loading} disabled={!q.trim() || !botId}>
                Send ➤
              </Button>
            </div>
            <p className="text-[11px] opacity-50 px-1 py-1.5">↵ Enter to send · ⇧↵ for a new line</p>
          </form>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="font-semibold mb-3 text-sm">Retrieved sources</h2>
            {!last ? (
              <p className="text-[13px] opacity-60">প্রশ্ন পাঠালে এখানে sources + confidence দেখাবে।</p>
            ) : (
              <>
                {last.sources.length === 0 && <p className="text-[13px] opacity-60">No grounding source — bot fell back.</p>}
                <div className="flex flex-col gap-2">
                  {last.sources.map((s, i) => (
                    <span key={i} className="badge bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800">
                      📄 {(s.source_id ?? s.chunk_id ?? "chunk").slice(0, 12)} · {Math.round((s.score ?? 0) * 100)}%
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-60">Confidence</span><strong>{conf}%</strong>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-2 rounded-full" style={{ width: `${conf}%`, background: "linear-gradient(90deg,#6366F1,#8B5CF6)" }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="badge bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">intent: {last.intent}</span>
                  <span className="badge bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">lang: {last.lang}</span>
                  {last.handoff && <span className="badge bg-amber-100 text-amber-800">handoff: {last.handoff_reason}</span>}
                </div>
              </>
            )}
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" aria-label="Good answer">👍</Button>
              <Button variant="ghost" aria-label="Bad answer">👎</Button>
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold mb-1.5 text-sm">💡 Tip</h2>
            <p className="text-[13px] opacity-70 leading-relaxed">Low confidence answers fall back to human handoff automatically — see Rules in docs.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
