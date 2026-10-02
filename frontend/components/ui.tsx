"use client";
import React from "react";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  loading?: boolean;
};

export function Button({ children, variant = "primary", loading, disabled, ...rest }: BtnProps) {
  const cls = variant === "primary" ? "btn-primary" : "btn-ghost";
  return (
    <button {...rest} disabled={disabled || loading} className={`${cls} ${rest.className ?? ""}`}>
      {loading ? (
        <span className="typing-dots" style={{ padding: 0 }} aria-label="Loading">
          <span /><span /><span />
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Ready: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    Processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    Failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    new: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    contacted: "bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-300",
  };
  const dot: Record<string, string> = {
    Ready: "bg-green-500", open: "bg-blue-500", new: "bg-purple-500",
    Processing: "bg-amber-500", Failed: "bg-red-500", resolved: "bg-green-500",
  };
  return (
    <span className={`badge ${map[status] ?? "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

export function UsageMeter({ used, quota, label }: { used: number; quota: number; label: string }) {
  const pct = Math.min(100, Math.round((used / quota) * 100));
  const hot = pct >= 90;
  return (
    <div role="meter" aria-valuenow={used} aria-valuemin={0} aria-valuemax={quota} aria-label={label}>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums opacity-70">{used.toLocaleString()}/{quota.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: hot ? "var(--danger)" : "linear-gradient(90deg,#6366F1,#8B5CF6)" }}
        />
      </div>
    </div>
  );
}

export function ChatBubble({ role, text, time }: { role: "user" | "bot"; text: string; time?: string }) {
  const mine = role === "user";
  return (
    <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && (
        <span className="brand-mark" style={{ width: 28, height: 28, fontSize: 13, borderRadius: 9 }} aria-hidden="true">
          N
        </span>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed ${
          mine
            ? "rounded-2xl rounded-br-md text-white shadow-md"
            : "card rounded-2xl rounded-bl-md"
        }`}
        style={mine ? { background: "linear-gradient(135deg,#4F46E5,#7C3AED)" } : undefined}
        aria-live={mine ? undefined : "polite"}
      >
        <p className="whitespace-pre-wrap break-words">{text}</p>
        {time && <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "opacity-50"}`}>{time}</p>}
      </div>
    </div>
  );
}

export function SourceChip({ name, confidence }: { name: string; confidence: number }) {
  return (
    <span className="badge bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800">
      📄 {name} · {Math.round(confidence * 100)}%
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-xl" style={{ background: "var(--primary-soft)" }}>
        📭
      </div>
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-sm opacity-70 mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
