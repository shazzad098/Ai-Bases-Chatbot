"use client";
import { useState } from "react";
import { Card, Button } from "@/components/ui";
const SNIPPET = `<script src="https://cdn.nichedesk.com/widget.js" data-bot="BOT_ID" async></script>`;
export default function InstallPage() {
  const [status, setStatus] = useState("Not verified");
  return (
    <div className="flex flex-col gap-4"><h1 className="text-2xl font-bold">Install</h1>
      <Card><p className="text-sm mb-2">Paste before <code>&lt;/body&gt;</code>:</p>
        <pre className="rounded bg-black/5 dark:bg-white/10 p-3 text-xs overflow-x-auto">{SNIPPET}</pre>
        <div className="flex gap-2 mt-3">
          <Button onClick={() => navigator.clipboard?.writeText(SNIPPET)}>Copy</Button>
          <Button variant="ghost" onClick={() => setStatus("Verified ✓ (mock — wire to GET /v1/bots/:id/install-status)")}>Verify</Button>
        </div>
        <p className="text-sm mt-2" role="status">{status}</p>
      </Card>
    </div>
  );
}
