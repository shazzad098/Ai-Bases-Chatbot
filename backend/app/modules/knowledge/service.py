"""Knowledge service: parse, chunk, hash-embed, hybrid search. Why: offline RAG, no API."""
import hashlib
import math
import re
from dataclasses import dataclass

DIM = 384
_WORD = re.compile(r"[a-zA-Z\u0980-\u09FF0-9]+")


def tokenize(text: str) -> list[str]:
    """Lowercase word tokens incl. Bangla range."""
    return _WORD.findall(text.lower())


def embed(text: str, dim: int = DIM) -> list[float]:
    """Hash-based TF embedding, L2-normalized. Why: deterministic, no model download."""
    vec = [0.0] * dim
    for tok in tokenize(text):
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16) % dim
        vec[h] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def cosine(a: list[float], b: list[float]) -> float:
    """Cosine similarity of two normalized vectors."""
    return sum(x * y for x, y in zip(a, b))


def keyword_score(query: str, doc: str) -> float:
    """BM25-ish overlap: fraction of query terms present in doc."""
    q = set(tokenize(query))
    if not q:
        return 0.0
    d = set(tokenize(doc))
    return len(q & d) / len(q)


def clean_text(text: str, keep_lines: bool = False) -> str:
    """Collapse whitespace; strip control chars."""
    t = (text or "").strip()
    if keep_lines:
        lines = [" ".join(ln.split()) for ln in t.splitlines()]
        return "\n".join(lines)
    return re.sub(r"\s+", " ", t)


def chunk_text(text: str, target: int = 500, overlap: int = 80) -> list[str]:
    """Word-window chunking (~300-800 tokens) with overlap. Why: portable, no tokenizer.

    Blank-line-separated blocks (e.g. one FAQ row per block) are kept whole
    when short, so a retrieved chunk is exactly one Q/A unit — never a mash
    of several rows.
    """
    blocks = [b.strip() for b in re.split(r"\n\s*\n", clean_text(text, keep_lines=True)) if b.strip()]
    if not blocks:
        return []
    chunks: list[str] = []
    for block in blocks:
        # Collapse spaces/tabs but KEEP newlines: Q:/A: line structure
        # must survive so answer extraction can pick a single answer.
        block = "\n".join(re.sub(r"[ \t]+", " ", ln).strip() for ln in block.splitlines()).strip()
        if not block:
            continue
        if len(re.findall(r"\S+", block)) <= target:
            chunks.append(block)
            continue
        words = [w for w in re.sub(r"\s+", " ", block).split(" ") if w]
        i = 0
        while i < len(words):
            chunks.append(" ".join(words[i : i + target]))
            if i + target >= len(words):
                break
            i += target - overlap
    return chunks


def parse_file(filename: str, raw: bytes) -> str:
    """Extract text from pdf/docx/csv/txt bytes (best-effort).

    CSVs become one `Q:/A:` block per row (blank-line separated) so each
    chunk is exactly one FAQ entry — the bot then answers with just the
    matching answer instead of a mash of rows.
    """
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        from pypdf import PdfReader
        import io

        reader = PdfReader(io.BytesIO(raw))
        return "\n".join((p.extract_text() or "") for p in reader.pages)
    if name.endswith(".docx"):
        from docx import Document
        import io

        doc = Document(io.BytesIO(raw))
        return "\n".join(p.text for p in doc.paragraphs)
    if name.endswith(".csv"):
        return csv_to_faq_blocks(raw)
    try:
        return raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def csv_to_faq_blocks(raw: bytes) -> str:
    """Convert CSV rows to `Q:/A:` blocks, one block per row.

    Handles `question,answer[,question_bn,answer_bn]`-style files (Q/A
    column pairs) and generic CSVs (first cell = question, rest = answer).
    """
    import csv
    import io

    try:
        reader = csv.reader(io.StringIO(raw.decode("utf-8-sig", errors="ignore")))
        rows = [[c.strip() for c in r] for r in reader if any((c or "").strip() for c in r)]
    except Exception:
        return ""
    if not rows:
        return ""
    header = [h.lower() for h in rows[0]]
    has_header = any("question" in h or "answer" in h or h in {"q", "a"} for h in header)
    data = rows[1:] if has_header else rows

    q_cols = [i for i, h in enumerate(header)] if not has_header else [
        i for i, h in enumerate(header) if "question" in h or h == "q"]
    a_cols = [i for i, h in enumerate(header)] if not has_header else [
        i for i, h in enumerate(header) if "answer" in h or h == "a"]

    blocks: list[str] = []
    for r in data:
        pairs: list[tuple[str, str]] = []
        if has_header and q_cols and a_cols:
            for qi, ai in zip(q_cols, a_cols):
                q = r[qi] if qi < len(r) else ""
                a = r[ai] if ai < len(r) else ""
                if q and a:
                    pairs.append((q, a))
            # leftover Q/A columns without a partner
            for qi in q_cols[len(a_cols):]:
                if qi < len(r) and r[qi]:
                    pairs.append((r[qi], ""))
        elif len(r) >= 2:
            pairs.append((r[0], " ".join(c for c in r[1:] if c)))
        elif r:
            pairs.append((r[0], ""))
        lines = []
        for q, a in pairs:
            lines.append(f"Q: {q}")
            if a:
                lines.append(f"A: {a}")
        if lines:
            blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


@dataclass
class Hit:
    chunk_id: str
    content: str
    score: float
    source_id: str


BN_RE = re.compile(r"[\u0980-\u09FF]")


def question_lang(text: str) -> str:
    """'bn' if the question uses Bangla script, else 'en'. Why: answer in user's language."""
    return "bn" if BN_RE.search(text or "") else "en"


def extract_faq_answer(question: str, context: str) -> str:
    """Pick the single best `A:` for the question from `Q:/A:` context blocks.

    Matches the question against every `Q:` line, then returns the paired
    `A:` in the question's language (Bangla question → Bangla answer).
    Returns "" when nothing matches — the caller then falls back.
    """
    lang = question_lang(question)
    # Split context into row blocks; strip retriever markers like "[1] ".
    raw_blocks = [b.strip() for b in re.split(r"\n\s*\n", context or "") if b.strip()]
    best: tuple[float, str, str] | None = None  # (score, block, matched_q)
    for raw in raw_blocks:
        block = re.sub(r"^\[\d+\]\s*", "", raw).strip()
        pairs: list[tuple[str, str]] = []
        cur_q = ""
        for line in block.splitlines():
            s = line.strip()
            if re.match(r"(?i)^q\s*:", s):
                cur_q = re.sub(r"(?i)^q\s*:\s*", "", s)
            elif re.match(r"(?i)^a\s*:", s) and cur_q:
                pairs.append((cur_q, re.sub(r"(?i)^a\s*:\s*", "", s)))
                cur_q = ""
        if not pairs:
            continue
        for q, _ in pairs:
            score = keyword_score(question, q)
            if not best or score > best[0]:
                best = (score, block, q)
    if not best or best[0] <= 0:
        # No Q/A structure matched — try the row whose question text the
        # query overlaps most, measured on the whole block.
        return ""
    _, block, _ = best
    pairs = []
    cur_q = ""
    for line in block.splitlines():
        s = line.strip()
        if re.match(r"(?i)^q\s*:", s):
            cur_q = re.sub(r"(?i)^q\s*:\s*", "", s)
        elif re.match(r"(?i)^a\s*:", s) and cur_q:
            pairs.append((cur_q, re.sub(r"(?i)^a\s*:\s*", "", s)))
            cur_q = ""
    # Prefer the pair written in the user's language.
    for q, a in pairs:
        if question_lang(q) == lang and a:
            return a
    for _, a in pairs:
        if a:
            return a
    return ""


def hybrid_search(query: str, rows: list, top_k: int = 4) -> list[Hit]:
    """Hybrid cosine (0.7) + keyword (0.3) ranking over chunk rows. Tenant/bot pre-filtered."""
    qvec = embed(query)
    scored: list[Hit] = []
    for r in rows:
        emb = r.embedding or []
        cos = cosine(qvec, emb) if len(emb) == DIM else 0.0
        kw = keyword_score(query, r.content)
        scored.append(Hit(str(r.id), r.content, 0.7 * cos + 0.3 * kw, str(r.source_id)))
    scored.sort(key=lambda h: h.score, reverse=True)
    return scored[:top_k]


def store_chunks(db, tenant_id: str, bot_id: str, source_id: str, text: str) -> int:
    """Chunk + embed + persist (idempotent per call; caller handles source dedupe)."""
    from app.models import KnowledgeChunk

    chunks = chunk_text(text)
    for c in chunks:
        db.add(KnowledgeChunk(tenant_id=tenant_id, bot_id=bot_id, source_id=source_id, content=c, embedding=embed(c)))
    db.commit()
    return len(chunks)
