"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, Button, PageHeader, EmptyState } from "@/components/ui";
import { API_BASE, apiStrict, getSession, isAuthError } from "@/lib/api";

type Bot = { id: string; name: string; niche: string };
type Src = { id: string; name: string; type: string; status: string; chunks: number };

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function KnowledgePage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [botId, setBotId] = useState("");
  const [rows, setRows] = useState<Src[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"Upload" | "URL" | "Text">("Text");
  const [val, setVal] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getSession();
    setLoggedIn(!!s);
    if (!s) return;
    apiStrict<{ bots: Bot[] }>("/bots")
      .then((r) => {
        setBots(r.bots);
        if (r.bots.length > 0) setBotId(r.bots[0].id);
      })
      .catch((err) => {
        if (isAuthError(err)) {
          setLoggedIn(false);
          return;
        }
        setError("Backend-এর সাথে যোগাযোগ করা যাচ্ছে না।");
      });
  }, []);

  useEffect(() => {
    if (!botId) {
      setRows([]);
      return;
    }
    apiStrict<{ sources: { id: string; type: string; uri: string; status: string }[] }>(
      `/knowledge/sources?bot_id=${encodeURIComponent(botId)}`
    )
      .then((r) =>
        setRows(
          r.sources.map((s) => ({ id: s.id, name: s.uri || s.id.slice(0, 8), type: s.type, status: cap(s.status), chunks: 0 }))
        )
      )
      .catch(() => setError("Sources লোড করা যায়নি।"));
  }, [botId]);

  function authHeaders(): Record<string, string> {
    const s = getSession();
    return s ? { Authorization: `Bearer ${s.token}`, "X-Tenant-ID": s.tenantId } : {};
  }

  async function refreshSources() {
    if (!botId) return;
    const r = await apiStrict<{ sources: { id: string; type: string; uri: string; status: string }[] }>(
      `/knowledge/sources?bot_id=${encodeURIComponent(botId)}`
    );
    setRows(r.sources.map((s) => ({ id: s.id, name: s.uri || s.id.slice(0, 8), type: s.type, status: cap(s.status), chunks: 0 })));
  }

  async function seedDemo() {
    if (!botId || busy) return;
    setBusy(true);
    setError("");
    try {
      const b = bots.find((x) => x.id === botId);
      await apiStrict("/knowledge/seed-demo", {
        method: "POST",
        body: JSON.stringify({ bot_id: botId, niche: b?.niche ?? "ecommerce" }),
      });
      await refreshSources();
    } catch {
      setError("Sample FAQs লোড করা যায়নি — backend চালু আছে কিনা দেখুন।");
    } finally {
      setBusy(false);
    }
  }

  async function removeSource(id: string, name: string) {
    if (!window.confirm(`"${name}" মুছে ফেলবেন? এই source-এর সব chunks-ও মুছে যাবে।`)) return;
    setError("");
    try {
      await apiStrict(`/knowledge/${encodeURIComponent(id)}`, { method: "DELETE" });
      await refreshSources();
    } catch {
      setError("Source মোছা যায়নি — আবার চেষ্টা করুন।");
    }
  }

  async function submit() {
    if (!botId || busy) return;
    setBusy(true);
    setError("");
    try {
      if (tab === "Text") {
        if (!val.trim()) throw new Error("empty");
        await apiStrict("/knowledge/text", {
          method: "POST",
          body: JSON.stringify({ bot_id: botId, text: val }),
        });
      } else if (tab === "URL") {
        if (!val.trim()) throw new Error("empty");
        await apiStrict("/knowledge/url", {
          method: "POST",
          body: JSON.stringify({ bot_id: botId, url: val.trim() }),
        });
      } else {
        if (!file) throw new Error("empty");
        const fd = new FormData();
        fd.append("bot_id", botId);
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/knowledge/upload`, { method: "POST", headers: authHeaders(), body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      setOpen(false);
      setVal("");
      setFile(null);
      await refreshSources();
    } catch {
      setError("Source যোগ করা যায়নি — text/URL/file দিন, backend চালু আছে কিনা দেখুন।");
    } finally {
      setBusy(false);
    }
  }

  if (loggedIn === false) {
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <PageHeader title="Knowledge" sub="Your bot's brain — grounded answers come from here." />
        <EmptyState
          title="Login প্রয়োজন"
          hint="Knowledge base দেখতে আগে workspace-এ login করুন।"
          action={<Link href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Go to login →</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Knowledge"
        sub="Upload docs or paste text — the bot answers only from these sources."
        action={
          <>
            <select
              className="input"
              style={{ width: "auto", minWidth: 180 }}
              aria-label="Select bot"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            >
              {bots.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.niche})</option>
              ))}
            </select>
            <Button onClick={() => setOpen(true)} disabled={!botId}>+ Add source</Button>
          </>
        }
      />
      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      )}
      <Card className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="কোনো source নেই"
              hint="Text paste করুন বা demo-data/ থেকে FAQ upload করুন — তারপর Playground-এ টেস্ট করুন।"
              action={
                <span className="flex gap-2">
                  <Button onClick={() => setOpen(true)} disabled={!botId}>+ Add your first source</Button>
                  <Button variant="ghost" onClick={() => void seedDemo()} disabled={!botId || busy}>
                    ⚡ Load sample FAQs
                  </Button>
                </span>
              }
            />
          </div>
        ) : (
          <table className="table w-full">
            <thead><tr><th>Name</th><th>Type</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-[280px] truncate">{r.name}</td>
                  <td>{r.type}</td>
                  <td><Badge status={r.status} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => void removeSource(r.id, r.name)}
                      aria-label={`Delete ${r.name}`}
                      title="Delete source"
                      className="btn-ghost"
                      style={{ minHeight: 36, padding: "0 12px", color: "var(--danger)" }}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Add source" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-5" style={{ background: "var(--bg)" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-3">Add source</h2>
            <div role="tablist" aria-label="Source type" className="flex gap-2 mb-3">
              {(["Upload", "URL", "Text"] as const).map((x) => (
                <button
                  key={x}
                  role="tab"
                  aria-selected={tab === x}
                  onClick={() => setTab(x)}
                  className={`rounded-lg px-4 text-sm font-medium ${tab === x ? "btn-primary" : "btn-ghost"}`}
                >
                  {x}
                </button>
              ))}
            </div>
            {tab === "Upload" && <input type="file" className="input py-2" aria-label="Upload file" accept=".pdf,.docx,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />}
            {tab === "URL" && <input className="input" placeholder="https://…" value={val} onChange={(e) => setVal(e.target.value)} />}
            {tab === "Text" && <textarea className="input min-h-[140px] py-2" placeholder="Paste FAQ / policy text…" value={val} onChange={(e) => setVal(e.target.value)} />}
            <div className="flex gap-2 mt-4">
              <Button onClick={submit} loading={busy}>Submit</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
