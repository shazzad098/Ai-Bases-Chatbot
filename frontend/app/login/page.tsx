"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, PageHeader } from "@/components/ui";
import { API_BASE, setSession } from "@/lib/api";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [workspace, setWorkspace] = useState("Demo Shop");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [niche, setNiche] = useState("ecommerce");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "signup" ? `${API_BASE}/auth/signup` : `${API_BASE}/auth/login`;
      const body =
        mode === "signup"
          ? { email, password, workspace, niche }
          : { email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.detail || `Request failed (HTTP ${res.status})`);
        return;
      }
      setSession(data.token, data.tenant_id);
      router.push("/playground");
    } catch {
      setError(`Backend-এর সাথে যোগাযোগ করা যাচ্ছে না (${API_BASE})। Backend চালু আছে কিনা দেখুন: cd backend → python -m uvicorn app.main:app --reload --port 8000`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto">
      <PageHeader title={mode === "signup" ? "Create workspace" : "Welcome back"} sub="One account per business — every bot and chat stays isolated." />
      <Card>
        <div className="flex gap-2 mb-4" role="tablist" aria-label="Auth mode">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setError(""); }}
              className={`rounded-lg px-4 text-sm font-medium capitalize ${mode === m ? "btn-primary" : "btn-ghost"}`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <label className="text-sm font-medium">
                Workspace name
                <input className="input mt-1" value={workspace} onChange={(e) => setWorkspace(e.target.value)} required minLength={2} placeholder="Demo Shop" />
              </label>
              <label className="text-sm font-medium">
                Niche pack
                <select className="input mt-1" value={niche} onChange={(e) => setNiche(e.target.value)}>
                  <option value="ecommerce">E-commerce</option>
                  <option value="education">Education</option>
                </select>
              </label>
            </>
          )}
          <label className="text-sm font-medium">
            Email
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@shop.com" />
          </label>
          <label className="text-sm font-medium">
            Password
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </label>
          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-[13px] text-red-700 dark:text-red-300" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={loading}>
            {mode === "signup" ? "Create workspace →" : "Log in →"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
