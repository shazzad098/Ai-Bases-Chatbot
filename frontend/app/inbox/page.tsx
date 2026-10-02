"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Badge, Button, ChatBubble, PageHeader, EmptyState } from "@/components/ui";
import { api, mockFallbacks } from "@/lib/api";

type C = { id: string; user: string; preview: string; status: string; lang: string };
type TMsg = { role: "user" | "bot" | "agent"; text: string; time: string };
type ConvRow = { id: string; bot_id: string; status: string; customer_ref: string; last_message: string };

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function InboxPage() {
  const [list, setList] = useState<C[]>([]);
  const [sel, setSel] = useState<C | null>(null);
  const [thread, setThread] = useState<TMsg[]>([]);
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ conversations: ConvRow[] }>("/conversations", {}, { conversations: [] }).then((r) => {
      const mapped: C[] = (r.conversations ?? []).map((c) => ({
        id: c.id, user: c.customer_ref || "Guest", preview: c.last_message || "—", status: c.status, lang: "—",
      }));
      const rows = mapped.length > 0 ? mapped : (mockFallbacks.conversations as C[]);
      setList(rows);
      setSel(rows[0] ?? null);
    });
  }, []);

  useEffect(() => {
    if (sel) {
      setThread([
        { role: "user", text: sel.preview, time: now() },
        { role: "bot", text: "(mock) Thanks! Let me check that for you.", time: now() },
      ]);
      setReply("");
    }
  }, [sel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread]);

  function sendReply() {
    const text = reply.trim();
    if (!text || !sel) return;
    setReply("");
    setThread((t) => [...t, { role: "agent", text, time: now() }]);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Inbox" sub="Take over from the bot with full context — Enter sends your reply." />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr_250px]">
        <Card className="p-3">
          <h2 className="text-sm font-semibold mb-2 px-1">Conversations</h2>
          {list.length === 0 ? (
            <p className="text-sm opacity-60 px-1">No conversations yet.</p>
          ) : (
            <ul className="flex lg:flex-col gap-1.5 overflow-x-auto">
              {list.map((c) => {
                const active = sel?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSel(c)}
                      aria-current={active}
                      className="w-full text-left rounded-xl p-2.5 text-sm transition-colors"
                      style={{
                        background: active ? "var(--primary-soft)" : "transparent",
                        border: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                      }}
                    >
                      <span className="font-semibold flex items-center gap-2">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#4F46E5,#8B5CF6)" }}
                        >
                          {c.user.charAt(0).toUpperCase()}
                        </span>
                        {c.user}
                      </span>
                      <span className="opacity-70 block mt-1 truncate text-[13px]">{c.preview}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold">Transcript {sel && <Badge status={sel.status} />}</h2>
            {sel && <span className="text-xs opacity-60">🌐 {sel.lang.toUpperCase()}</span>}
          </div>
          <div ref={scrollRef} className="chat-scroll flex flex-col gap-3 px-5 py-4 h-[340px] overflow-y-auto" aria-live="polite">
            {sel ? (
              thread.map((m, i) =>
                m.role === "agent" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-md" style={{ background: "linear-gradient(135deg,#059669,#10B981)" }}>
                      <p className="text-[11px] font-semibold text-white/80 mb-0.5">You (agent)</p>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className="mt-1 text-[11px] text-white/70">{m.time}</p>
                    </div>
                  </div>
                ) : (
                  <ChatBubble key={i} role={m.role === "bot" ? "bot" : "user"} text={m.text} time={m.time} />
                )
              )
            ) : (
              <EmptyState title="Select a conversation" hint="Pick a chat from the list to see the full transcript." />
            )}
          </div>
          <form
            className="px-4 pt-2 pb-1.5"
            style={{ borderTop: "1px solid var(--border)" }}
            onSubmit={(e) => {
              e.preventDefault();
              sendReply();
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                className="input py-2.5"
                style={{ minHeight: 44, maxHeight: 120 }}
                rows={1}
                aria-label="Reply as agent"
                placeholder={sel ? `Reply to ${sel.user}… (Enter to send)` : "Select a conversation first…"}
                value={reply}
                disabled={!sel}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <Button type="submit" disabled={!sel || !reply.trim()}>
                Send ➤
              </Button>
            </div>
            <p className="text-[11px] opacity-50 px-1 py-1.5">↵ Enter to send · ⇧↵ for a new line</p>
          </form>
          <div className="flex gap-2 px-4 pb-3">
            <Button variant="ghost">✓ Resolve</Button>
            <Button variant="ghost">↗ Handoff to human</Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold mb-2">Customer context</h2>
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
              style={{ background: "linear-gradient(135deg,#4F46E5,#8B5CF6)" }}
            >
              {(sel?.user ?? "?").charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold">{sel?.user ?? "—"}</p>
              <p className="text-xs opacity-60">Lang: {sel?.lang.toUpperCase() ?? "—"}</p>
            </div>
          </div>
          <div className="rounded-xl p-3 text-[13px] opacity-80 leading-relaxed" style={{ background: "var(--primary-soft)" }}>
            Order history / profile placeholder — wire to customer API.
          </div>
        </Card>
      </div>
    </div>
  );
}
