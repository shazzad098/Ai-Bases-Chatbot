"use client";
export type Lang = "en" | "bn";
const KEY = "nichedesk_lang";
export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem(KEY) as Lang) === "bn" ? "bn" : "en";
}
export function setLang(l: Lang) {
  localStorage.setItem(KEY, l);
  document.documentElement.lang = l === "bn" ? "bn" : "en";
  window.dispatchEvent(new CustomEvent("nichedesk-lang", { detail: l }));
}

export const dict = {
  en: {
    overview: "Overview", conversations: "Conversations", resolution: "Resolution rate",
    csat: "CSAT", leads: "Leads", setupChecklist: "Setup checklist", topUnanswered: "Top unanswered",
    send: "Send", askPlaceholder: "Ask something…", sources: "Sources", confidence: "Confidence",
    addSource: "Add source", inbox: "Inbox", billing: "Billing", install: "Install"
  },
  bn: {
    overview: "ওভারভিউ", conversations: "কথোপকথন", resolution: "সমাধানের হার",
    csat: "সন্তুষ্টি", leads: "লিড", setupChecklist: "সেটআপ চেকলিস্ট", topUnanswered: "শীর্ষ অনুত্তরিত",
    send: "পাঠান", askPlaceholder: "কিছু জিজ্ঞাসা করুন…", sources: "উৎস", confidence: "আত্মবিশ্বাস",
    addSource: "উৎস যোগ করুন", inbox: "ইনবক্স", billing: "বিলিং", install: "ইনস্টল"
  }
} as const;
export type DictKey = keyof typeof dict.en;
export function t(lang: Lang, k: DictKey): string { return dict[lang][k] ?? dict.en[k]; }
// Rule: no hardcoded customer-facing strings in components — import t() + lang state instead.
