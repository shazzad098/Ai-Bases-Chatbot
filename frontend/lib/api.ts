const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nichedesk_token");
}
function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nichedesk_tenant");
}
export function setToken(t: string) { localStorage.setItem("nichedesk_token", t); }
export function setSession(token: string, tenantId: string) {
  localStorage.setItem("nichedesk_token", token);
  localStorage.setItem("nichedesk_tenant", tenantId);
}
export function getSession(): { token: string; tenantId: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("nichedesk_token");
  const tenantId = localStorage.getItem("nichedesk_tenant");
  return token && tenantId ? { token, tenantId } : null;
}
export function clearToken() {
  localStorage.removeItem("nichedesk_token");
  localStorage.removeItem("nichedesk_tenant");
}

export type ApiError = { message: string; status: number };

function httpError(status: number): Error & { status: number } {
  const err = new Error(`HTTP ${status}`) as Error & { status: number };
  err.status = status;
  return err;
}

function isAuthError(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { status?: number }).status === 401;
}

export { isAuthError };

/** Drop a dead/expired session so the UI falls back to the login prompt. */
function dropDeadSession(res: { status: number }) {
  if (res.status === 401 && typeof window !== "undefined" && getToken()) {
    clearToken();
    window.dispatchEvent(new CustomEvent("nichedesk-unauth"));
  }
}

export async function api<T>(path: string, opts: RequestInit = {}, fallback?: T): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((opts.headers as Record<string, string>) ?? {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const tenant = getTenantId();
  if (tenant) headers["X-Tenant-ID"] = tenant;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      dropDeadSession(res);
      throw httpError(res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

/** Same as api() but never falls back to mocks — throws on any failure. */
export async function apiStrict<T>(path: string, opts: RequestInit = {}): Promise<T> {
  return api<T>(path, opts);
}

export const mockFallbacks = {
  kpis: { conversations: 1284, resolution: 0.72, csat: 4.6, leads: 213 },
  sources: [
    { id: "s1", name: "Product FAQ (URL)", type: "url", status: "Ready", chunks: 148 },
    { id: "s2", name: "Shipping policy.pdf", type: "file", status: "Processing", chunks: 0 },
    { id: "s3", name: "Old catalog.csv", type: "file", status: "Failed", chunks: 0 }
  ],
  conversations: [
    { id: "c1", user: "Rahim U.", preview: "ডেলিভারি চার্জ কত?", status: "open", lang: "bn" },
    { id: "c2", user: "Sara K.", preview: "Refund policy?", status: "open", lang: "en" },
    { id: "c3", user: "Tanvir A.", preview: "Course duration?", status: "resolved", lang: "en" }
  ],
  leads: [
    { id: "l1", name: "Rahim U.", contact: "+8801XXXXXXXXX", intent: "bulk order", status: "new" },
    { id: "l2", name: "Sara K.", contact: "sara@example.com", intent: "course enrollment", status: "contacted" }
  ]
};

export { API_BASE };
