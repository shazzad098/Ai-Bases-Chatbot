"use client";
import { useState } from "react";
import { Card, Button, UsageMeter } from "@/components/ui";
const PLANS = [
  { name: "Trial", price: "$0", feats: ["100 msgs/mo", "1 bot"] },
  { name: "Starter", price: "$19", feats: ["2k msgs/mo", "2 bots"] },
  { name: "Growth", price: "$59", feats: ["10k msgs/mo", "5 bots"] },
  { name: "Scale", price: "$149", feats: ["50k msgs/mo", "unlimited bots"] }
];
export default function BillingPage() {
  const [plan, setPlan] = useState("Trial");
  return (
    <div className="flex flex-col gap-4"><h1 className="text-2xl font-bold">Billing</h1>
      <Card><UsageMeter used={640} quota={2000} label="Messages used" /></Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => (
          <Card key={p.name}><h2 className="font-bold">{p.name}</h2><p className="text-2xl font-bold">{p.price}</p>
            <ul className="text-sm my-2">{p.feats.map((f) => <li key={f}>• {f}</li>)}</ul>
            <Button variant={plan === p.name ? "ghost" : "primary"} onClick={() => setPlan(p.name)}>{plan === p.name ? "Current" : "Choose"}</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
