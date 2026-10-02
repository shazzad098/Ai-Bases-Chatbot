"""Versioned niche-pack config bundles. Why: niche behavior is config, not code."""
from typing import Any

ECOMMERCE_PACK: dict[str, Any] = {
    "id": "ecommerce_v1",
    "version": "1.0.0",
    "niche": "ecommerce",
    "system_prompt_en": (
        "You are NicheDesk, an AI shop assistant. Answer ONLY from the store knowledge "
        "or tool results. Never invent prices, stock, or order status. "
        "If unsure, say you don't know and offer a human agent. Cite sources."
    ),
    "system_prompt_bn": (
        "আপনি NicheDesk, একটি AI শপ সহকারী। শুধুমাত্র দোকানের তথ্য থেকে উত্তর দিন। "
        "দাম, স্টক বা অর্ডার অবস্থা অনুমান করবেন না। নিশ্চিত না হলে মানব এজেন্টের সাহায্য দিন।"
    ),
    "quick_replies": ["Track my order", "Return policy", "Delivery charge", "Talk to human"],
    "intents": ["pricing", "delivery", "return", "tracking", "availability", "lead", "human", "small-talk", "faq"],
    "tools": ["order_status", "product_search", "return_policy", "lead_capture"],
    "forms": ["return_request", "order_inquiry"],
    "kpis": ["deflection_rate", "cart_recovery", "csat"],
}

EDUCATION_PACK: dict[str, Any] = {
    "id": "education_v1",
    "version": "1.0.0",
    "niche": "education",
    "system_prompt_en": (
        "You are NicheDesk, an AI admission assistant. Answer ONLY from the institute "
        "knowledge. Never invent fees, dates, or schedules. If unsure, say you don't "
        "know and offer a human counsellor. Cite sources."
    ),
    "system_prompt_bn": (
        "আপনি NicheDesk, একটি AI ভর্তি সহকারী। শুধুমাত্র প্রতিষ্ঠানের তথ্য থেকে উত্তর দিন। "
        "ফি বা তারিখ অনুমান করবেন না। নিশ্চিত না হলে মানব কাউন্সেলরের সাহায্য দিন।"
    ),
    "quick_replies": ["Admission info", "Fee structure", "Class schedule", "Talk to human"],
    "intents": ["admission", "fees", "schedule", "courses", "lead", "human", "small-talk", "faq"],
    "tools": ["admission_info", "fee_structure", "course_search", "schedule", "inquiry_form"],
    "forms": ["inquiry_form"],
    "kpis": ["deflection_rate", "inquiry_conversion", "csat"],
}

PACKS = {"ecommerce": ECOMMERCE_PACK, "education": EDUCATION_PACK}


def get_pack(niche: str) -> dict[str, Any]:
    """Load a niche pack by name, defaulting to ecommerce."""
    return PACKS.get((niche or "ecommerce").lower(), ECOMMERCE_PACK)


def system_prompt_for(niche: str, lang: str) -> str:
    """Pick the EN/BN system prompt for a niche + language."""
    pack = get_pack(niche)
    return pack["system_prompt_bn"] if lang == "bn" else pack["system_prompt_en"]
