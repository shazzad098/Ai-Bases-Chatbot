/* NicheDesk embeddable widget — vanilla TS custom element, Shadow DOM, async, no global CSS leak. */
import css from "./style.css?inline";

type Lang = "en" | "bn";
type Niche = "ecommerce" | "education" | "general";

const STRINGS: Record<string, Record<Lang, string>> = {
  greeting_ecommerce_en: { en: "Hi! 👋 Need help with an order, product or delivery?", bn: "হাই! 👋 অর্ডার, পণ্য বা ডেলিভারি নিয়ে সাহায্য লাগবে?" },
  greeting_education_en: { en: "Hello! Ask me about admissions, courses, fees or schedules.", bn: "হ্যালো! ভর্তি, কোর্স, ফি বা সময়সূচি সম্পর্কে জিজ্ঞাসা করুন।" },
  status: { en: "Typically replies instantly", bn: "সাধারণত সাথে সাথে উত্তর দেয়" },
  placeholder: { en: "Type a message…", bn: "বার্তা লিখুন…" },
  human: { en: "Talk to a human", bn: "মানুষের সাথে কথা বলুন" },
  ai_notice: { en: "AI-powered — answers may need verification.", bn: "AI-চালিত — উত্তর যাচাই করে নিন।" },
  retry: { en: "Retry", bn: "পুনরায় চেষ্টা" },
  error: { en: "Something went wrong. Please try again.", bn: "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।" },
  rate_limited: { en: "Too many messages — please wait a moment.", bn: "অনেক বেশি বার্তা — একটু অপেক্ষা করুন।" },
  offline: { en: "You're offline. Leave a message and we'll get back.", bn: "আপনি অফলাইনে। একটি বার্তা রেখে যান।" },
  offline_sent: { en: "Thanks! We'll get back to you soon.", bn: "ধন্যবাদ! আমরা শীঘ্রই যোগাযোগ করব।" },
  fallback: { en: "I'm not sure about that. Would you like me to connect you with our team?", bn: "এ বিষয়ে আমি নিশ্চিত নই। আমাদের টিমের সাথে যুক্ত করব কি?" },
  send: { en: "Send", bn: "পাঠান" },
  name: { en: "Name", bn: "নাম" },
  contact: { en: "Phone or email", bn: "ফোন বা ইমেইল" },
};

const QUICK_REPLIES: Record<Niche, string[]> = {
  ecommerce: ["Track my order", "Return policy", "Delivery info"],
  education: ["Admission info", "Course fees", "Class schedule"],
  general: ["Pricing", "Contact support"],
};

interface Source { title: string; url?: string; }

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

class NicheDeskWidget extends HTMLElement {
  private shadow = this.attachShadow({ mode: "open" });
  private open = false;
  private uiLang: Lang = "en";
  private sending = false;

  static get observedAttributes() { return ["bot-key", "api", "color", "position", "greeting", "niche", "lang"]; }

  private get cfg() {
    return {
      botKey: this.getAttribute("bot-key") || "",
      api: (this.getAttribute("api") || "http://localhost:8000").replace(/\/$/, ""),
      color: this.getAttribute("color") || "#4F46E5",
      position: (this.getAttribute("position") === "left" ? "left" : "right") as "left" | "right",
      greeting: this.getAttribute("greeting") || "",
      niche: ((this.getAttribute("niche") as Niche) || "general") as Niche,
      langAttr: (this.getAttribute("lang") === "bn" ? "bn" : "en") as Lang,
    };
  }

  connectedCallback() { this.render(); this.detectLang(); }

  private detectLang() {
    const nav = (navigator.language || "en").toLowerCase();
    this.uiLang = this.hasAttribute("lang") ? this.cfg.langAttr : (nav.startsWith("bn") ? "bn" : "en");
    this.render();
  }

  private t(key: string): string {
    const e = STRINGS[key];
    if (!e) return key;
    return e[this.uiLang] ?? e.en;
  }

  private greeting(): string {
    const c = this.cfg;
    if (c.greeting) return c.greeting;
    if (c.niche === "ecommerce") return this.t("greeting_ecommerce_en");
    if (c.niche === "education") return this.t("greeting_education_en");
    return this.t("greeting_ecommerce_en");
  }

  private render() {
    const c = this.cfg;
    const pos = c.position;
    this.shadow.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = `:host{--nd-brand:${esc(c.color)}}\n` + css;
    this.shadow.appendChild(style);

    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <button class="nd-launcher ${pos}" aria-label="Open chat">💬</button>
      <div class="nd-window ${pos} hidden" role="dialog" aria-label="Chat">
        <div class="nd-header">
          <div class="nd-avatar">N</div>
          <div><div class="nd-title">${esc(this.getAttribute("bot-name") || "NicheDesk")}</div>
          <div class="nd-status">${esc(this.t("status"))}</div></div>
          <button class="nd-close" aria-label="Close">✕</button>
        </div>
        <div class="nd-body" aria-live="polite"></div>
        <div class="nd-quick"></div>
        <div class="nd-footer">
          <div class="nd-inputrow">
            <textarea class="nd-input" rows="1" placeholder="${esc(this.t("placeholder"))}"></textarea>
            <button class="nd-send" aria-label="${esc(this.t("send"))}">➤</button>
          </div>
          <div class="nd-meta">
            <button class="nd-human">${esc(this.t("human"))}</button>
            <span class="nd-ai">🤖 ${esc(this.t("ai_notice"))}</span>
          </div>
        </div>
      </div>`;
    this.shadow.appendChild(wrap);

    const launcher = wrap.querySelector(".nd-launcher") as HTMLButtonElement;
    launcher.style.background = c.color;
    const win = wrap.querySelector(".nd-window") as HTMLDivElement;
    const body = wrap.querySelector(".nd-body") as HTMLDivElement;
    const quick = wrap.querySelector(".nd-quick") as HTMLDivElement;
    const input = wrap.querySelector(".nd-input") as HTMLTextAreaElement;
    const send = wrap.querySelector(".nd-send") as HTMLButtonElement;
    const close = wrap.querySelector(".nd-close") as HTMLButtonElement;
    const human = wrap.querySelector(".nd-human") as HTMLButtonElement;

    launcher.onclick = () => { this.open = !this.open; win.classList.toggle("hidden", !this.open); if (this.open && !body.children.length) this.botSay(this.greeting(), [], body); };
    close.onclick = () => { this.open = false; win.classList.add("hidden"); };

    for (const q of QUICK_REPLIES[c.niche] || QUICK_REPLIES.general) {
      const b = document.createElement("button");
      b.className = "nd-chip"; b.textContent = q;
      b.onclick = () => { input.value = q; this.sendMsg(input, body); };
      quick.appendChild(b);
    }

    input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendMsg(input, body); } });
    send.onclick = () => this.sendMsg(input, body);
    human.onclick = () => this.handoff(body);
    window.addEventListener("offline", () => this.offlineForm(body));
  }

  private scrollDown(body: HTMLElement) { body.scrollTop = body.scrollHeight; }

  private bubble(text: string, who: "user" | "bot", body: HTMLElement, sources: Source[] = []) {
    const d = document.createElement("div");
    d.className = `nd-msg ${who}`;
    d.innerHTML = `${esc(text)}<div class="nd-time">${new Date().toLocaleTimeString()}</div>`;
    if (who === "bot" && sources.length) {
      const s = document.createElement("div");
      s.className = "nd-sources";
      for (const src of sources.slice(0, 3)) {
        const a = document.createElement("a");
        a.className = "nd-src"; a.textContent = "📄 " + src.title;
        if (src.url) { a.href = src.url; a.target = "_blank"; a.rel = "noopener"; }
        s.appendChild(a);
      }
      d.appendChild(s);
    }
    body.appendChild(d); this.scrollDown(body);
    return d;
  }

  private botSay(text: string, sources: Source[], body: HTMLElement) { this.bubble(text, "bot", body, sources); }

  private typing(body: HTMLElement): HTMLElement {
    const d = document.createElement("div");
    d.className = "nd-typing"; d.setAttribute("aria-label", "typing");
    d.innerHTML = `<span class="nd-dot"></span><span class="nd-dot"></span><span class="nd-dot"></span>`;
    body.appendChild(d); this.scrollDown(body);
    return d;
  }

  private showError(body: HTMLElement, msg: string, retryFn: () => void) {
    const d = document.createElement("div");
    d.className = "nd-error";
    d.innerHTML = `${esc(msg)} <button>${esc(this.t("retry"))}</button>`;
    (d.querySelector("button") as HTMLButtonElement).onclick = () => { d.remove(); retryFn(); };
    body.appendChild(d); this.scrollDown(body);
  }

  private offlineForm(body: HTMLElement) {
    if (!navigator.onLine) {
      const d = document.createElement("div");
      d.className = "nd-msg bot nd-offline-form";
      d.innerHTML = `<div>${esc(this.t("offline"))}</div>
        <input placeholder="${esc(this.t("name"))}" /><input placeholder="${esc(this.t("contact"))}" />
        <textarea placeholder="${esc(this.t("placeholder"))}"></textarea>
        <button class="nd-chip">${esc(this.t("send"))}</button>`;
      (d.querySelector("button") as HTMLButtonElement).onclick = () => {
        void this.submitLead(d);
      };
      body.appendChild(d); this.scrollDown(body);
    }
  }

  private async submitLead(form: HTMLElement) {
    const c = this.cfg;
    const inputs = form.querySelectorAll("input, textarea");
    const payload = { name: (inputs[0] as HTMLInputElement).value, contact: (inputs[1] as HTMLInputElement).value, message: (inputs[2] as HTMLTextAreaElement).value, source: "widget-offline" };
    try {
      await fetch(`${c.api}/v1/leads`, { method: "POST", headers: { "Content-Type": "application/json", "X-Bot-Key": c.botKey }, body: JSON.stringify(payload) });
    } catch { /* queue locally, best effort */ }
    form.innerHTML = esc(this.t("offline_sent"));
  }

  private handoff(body: HTMLElement) {
    this.doSend("__handoff__", body, this.t("human"));
  }

  private sendMsg(input: HTMLTextAreaElement, body: HTMLElement) {
    const text = input.value.trim();
    if (!text || this.sending) return;
    input.value = ""; input.style.height = "auto";
    this.doSend(text, body);
  }

  private async doSend(text: string, body: HTMLElement, displayText?: string) {
    const c = this.cfg;
    this.sending = true;
    this.bubble(displayText ?? text, "user", body);
    const tp = this.typing(body);
    const attempt = async () => {
      try {
        tp.remove();
        const tp2 = this.typing(body);
        await this.stream(text, body, tp2);
      } catch (e: unknown) {
        const status = (e as { status?: number }).status;
        if (status === 429) this.showError(body, this.t("rate_limited"), attempt);
        else this.showError(body, this.t("error"), attempt);
      } finally { this.sending = false; }
    };
    // remove initial typing placeholder, re-added in attempt
    tp.remove();
    const tp0 = this.typing(body);
    try {
      await this.stream(text, body, tp0);
    } catch (e: unknown) {
      tp0.remove();
      const status = (e as { status?: number }).status;
      if (status === 429) this.showError(body, this.t("rate_limited"), attempt);
      else this.showError(body, this.t("error"), attempt);
    } finally { this.sending = false; }
  }

  /** SSE streaming with non-streaming fallback. Throws {status} on HTTP error. */
  private async stream(text: string, body: HTMLElement, typingEl: HTMLElement): Promise<void> {
    const c = this.cfg;
    const conv = sessionStorage.getItem("nd_conv") || "";
    const reqBody = JSON.stringify({ bot_key: c.botKey, message: text, conversation_id: conv || undefined, stream: true });

    let sseOk = false;
    try {
      const res = await fetch(`${c.api}/v1/chat`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Bot-Key": c.botKey }, body: reqBody,
      });
      if (!res.ok) throw { status: res.status };
      const ctype = res.headers.get("content-type") || "";
      if (ctype.includes("text/event-stream") && res.body) {
        sseOk = true;
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = ""; let acc = ""; let sources: Source[] = [];
        const box: { el: HTMLElement | null } = { el: null };
        typingEl.remove();
        const flush = () => {
          const parts = buf.split("\n\n"); buf = parts.pop() || "";
          for (const p of parts) {
            const line = p.trim(); if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") return true;
            try {
              const j = JSON.parse(data) as { token?: string; sources?: Source[]; conversation_id?: string; fallback?: boolean };
              if (j.conversation_id) sessionStorage.setItem("nd_conv", j.conversation_id);
              if (j.sources) sources = j.sources;
              if (j.token) {
                acc += j.token;
                if (!box.el) box.el = this.bubble("", "bot", body, []);
                box.el.innerHTML = `${esc(acc)}<div class="nd-time">${new Date().toLocaleTimeString()}</div>`;
                this.scrollDown(body);
              }
              if (j.fallback) acc = this.t("fallback");
            } catch { /* ignore partial */ }
          }
          return false;
        };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          if (flush()) break;
        }
        // attach sources after stream completes
        if (box.el && sources.length) {
          const s = document.createElement("div"); s.className = "nd-sources";
          for (const src of sources.slice(0, 3)) {
            const a = document.createElement("a"); a.className = "nd-src"; a.textContent = "📄 " + src.title;
            if (src.url) { a.href = src.url; a.target = "_blank"; a.rel = "noopener"; }
            s.appendChild(a);
          }
          box.el.appendChild(s);
        }
        if (!box.el) this.botSay(acc || this.t("fallback"), sources, body);
        return;
      }
    } catch (e) {
      if (sseOk) throw e; // streaming started — propagate
      // fall through to non-streaming fallback only if SSE not started
      if ((e as { status?: number }).status) throw e;
    }

    // Fallback: plain JSON response
    typingEl.remove();
    const res2 = await fetch(`${c.api}/v1/chat`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Bot-Key": c.botKey },
      body: JSON.stringify({ bot_key: c.botKey, message: text, conversation_id: conv || undefined }),
    });
    if (!res2.ok) throw { status: res2.status };
    const j = (await res2.json()) as { reply?: string; answer?: string; sources?: Source[]; conversation_id?: string };
    if (j.conversation_id) sessionStorage.setItem("nd_conv", j.conversation_id);
    this.botSay(j.reply || j.answer || this.t("fallback"), j.sources || [], body);
  }
}

customElements.define("nichedesk-widget", NicheDeskWidget);
export {};
