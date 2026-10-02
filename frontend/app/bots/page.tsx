"use client";
import { useState } from "react";
import { Card, Button, EmptyState } from "@/components/ui";
const TABS = ["Setup", "Knowledge", "Appearance", "Channels", "Install"];
export default function BotsPage() {
  const [tab, setTab] = useState("Setup");
  const [name, setName] = useState("Shop Assistant");
  const [niche, setNiche] = useState("E-commerce");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Bots</h1>
      <div role="tablist" aria-label="Bot setup tabs" className="flex gap-2 overflow-x-auto">
        {TABS.map((x) => (
          <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)}
            className={`rounded px-4 min-h-[44px] text-sm border ${tab === x ? "bg-primary text-white border-primary" : ""}`}
            style={tab !== x ? { borderColor: "var(--border)" } : undefined}>{x}</button>
        ))}
      </div>
      {tab === "Setup" && (
        <Card><div className="flex flex-col gap-3 max-w-md">
          <label className="text-sm">Bot name<input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="text-sm">Niche<select className="input mt-1" value={niche} onChange={(e) => setNiche(e.target.value)}><option>E-commerce</option><option>Education</option></select></label>
          <Button onClick={() => alert(`Saved ${name} (${niche}) — wire to POST /v1/bots`)}>Save</Button>
        </div></Card>
      )}
      {tab !== "Setup" && <EmptyState title={`${tab} lives on its own page`} hint="See sidebar: Knowledge / Appearance / Install." />}
    </div>
  );
}
