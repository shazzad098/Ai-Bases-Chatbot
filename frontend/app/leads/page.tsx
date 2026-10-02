"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, Button, PageHeader, EmptyState } from "@/components/ui";
import { api, apiStrict, getSession, isAuthError, mockFallbacks } from "@/lib/api";

type L = { id: string; name: string; contact: string; intent: string; status: string };
type LeadRow = { id: string; name: string; contact: string; payload: Record<string, string> };

const STATUSES = ["new", "contacted", "qualified", "converted", "closed"];

export default function LeadsPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [rows, setRows] = useState<L[]>([]);
  const [demo, setDemo] = useState(false);
  const [editing, setEditing] = useState<L | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", intent: "", status: "new" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = getSession();
    setLoggedIn(!!s);
    if (!s) return;
    api<{ leads: LeadRow[] }>("/leads", {}, { leads: [] })
      .then((r) => {
        const mapped: L[] = (r.leads ?? []).map((l) => ({
          id: l.id, name: l.name || "—", contact: l.contact || "—",
          intent: l.payload?.intent || l.payload?.source || "—",
          status: l.payload?.status || "new",
        }));
        if (mapped.length > 0) {
          setRows(mapped);
        } else {
          setRows(mockFallbacks.leads as L[]);
          setDemo(true);
        }
      })
      .catch((err) => {
        if (isAuthError(err)) {
          setLoggedIn(false);
          return;
        }
        setRows(mockFallbacks.leads as L[]);
        setDemo(true);
      });
  }, []);

  function openEdit(l: L) {
    setEditing(l);
    setForm({ name: l.name === "—" ? "" : l.name, contact: l.contact === "—" ? "" : l.contact, intent: l.intent === "—" ? "" : l.intent, status: l.status });
    setError("");
  }

  async function saveEdit() {
    if (!editing || busy || demo) return;
    setBusy(true);
    setError("");
    try {
      const updated = await apiStrict<{ id: string; name: string; contact: string; payload: Record<string, string> }>(
        `/leads/${encodeURIComponent(editing.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: form.name, contact: form.contact, intent: form.intent, status: form.status }),
        }
      );
      setRows((rs) =>
        rs.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                name: updated.name || "—",
                contact: updated.contact || "—",
                intent: updated.payload?.intent || "—",
                status: updated.payload?.status || "new",
              }
            : r
        )
      );
      setEditing(null);
    } catch (err) {
      if (isAuthError(err)) {
        setLoggedIn(false);
        return;
      }
      setError("Save করা যায়নি — আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }

  if (loggedIn === false) {
    return (
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <PageHeader title="Leads" sub="Every captured inquiry, in one place." />
        <EmptyState
          title="Login প্রয়োজন"
          hint="Leads দেখতে আগে workspace-এ login করুন।"
          action={<Link href="/login" className="btn-primary" style={{ textDecoration: "none" }}>Go to login →</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Leads"
        sub={demo ? "Demo data — login করে আসল leads দেখুন।" : `${rows.length} lead${rows.length === 1 ? "" : "s"} captured`}
      />
      <Card className="p-0 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="কোনো lead নেই" hint="Widget/offline form থেকে inquiry এলে এখানে দেখাবে।" />
          </div>
        ) : (
          <table className="table w-full">
            <thead><tr><th>Name</th><th>Contact</th><th>Intent</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.contact}</td>
                  <td>{r.intent}</td>
                  <td><Badge status={r.status} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => openEdit(r)}
                      disabled={demo}
                      title={demo ? "Demo data — edit disabled" : "Edit lead"}
                      className="btn-ghost"
                      style={{ minHeight: 36, padding: "0 12px" }}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {editing && (
        <div role="dialog" aria-modal="true" aria-label="Edit lead" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-md p-5" style={{ background: "var(--bg)" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-3">Edit lead</h2>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Name<input className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="text-sm font-medium">Contact<input className="input mt-1" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label>
              <label className="text-sm font-medium">Intent<input className="input mt-1" value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value })} /></label>
              <label className="text-sm font-medium">Status
                <select className="input mt-1" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-[13px] text-red-700 dark:text-red-300" role="alert">{error}</p>}
            <div className="flex gap-2 mt-4">
              <Button onClick={() => void saveEdit()} loading={busy}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
