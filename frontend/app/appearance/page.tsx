"use client";
import { useState } from "react";
import { Card, Button, ChatBubble } from "@/components/ui";
export default function AppearancePage() {
  const [color, setColor] = useState("#4F46E5");
  const [pos, setPos] = useState<"left" | "right">("right");
  const [greeting, setGreeting] = useState("Hi! How can I help? / কিভাবে সাহায্য করতে পারি?");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Appearance</h1>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card><div className="flex flex-col gap-3 max-w-sm">
          <label className="text-sm">Brand color<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="ml-2 h-11 w-16 align-middle" /></label>
          <label className="text-sm">Logo<input type="file" className="input mt-1" aria-label="Upload logo" /></label>
          <label className="text-sm">Position<select className="input mt-1" value={pos} onChange={(e) => setPos(e.target.value as "left" | "right")}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></label>
          <label className="text-sm">Greeting<textarea className="input min-h-[80px] py-2 mt-1" value={greeting} onChange={(e) => setGreeting(e.target.value)} /></label>
          <Button onClick={() => alert("Saved — wire to PATCH /v1/bots/:id/appearance")}>Save</Button>
        </div></Card>
        <Card>
          <h2 className="font-semibold text-sm mb-2">Live widget preview</h2>
          <div className="relative h-64 rounded border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className={`absolute bottom-3 ${pos === "right" ? "right-3" : "left-3"} w-56 rounded-xl border bg-white dark:bg-[#171A23] p-2 shadow-lg`}>
              <div className="rounded-t-lg p-2 text-white text-sm font-semibold" style={{ background: color }}>Shop Assistant</div>
              <div className="p-2 flex flex-col gap-2"><ChatBubble role="bot" text={greeting} /></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
