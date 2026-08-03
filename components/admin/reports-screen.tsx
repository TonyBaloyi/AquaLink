"use client"

import { TrendingUp, Droplet, Wallet, Download } from "lucide-react"
import { StatCard } from "@/components/cards"

const villageSupply = [
  { name: "Makonde Village", pct: 88 },
  { name: "Mavela Village", pct: 74 },
  { name: "Luphisi Village", pct: 61 },
  { name: "Kabokweni Village", pct: 52 },
  { name: "Nkosi Village", pct: 33 },
]

export function ReportsScreen() {
  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Reports</h2>
          <p className="text-sm text-muted-foreground">System performance overview</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Droplet} value="1.2M L" label="Water Supplied" sub="This Month" tint="teal" />
        <StatCard icon={Wallet} value="R52,000" label="Revenue" sub="This Month" tint="primary" />
        <StatCard icon={TrendingUp} value="+12%" label="Growth" sub="vs last month" tint="success" />
        <StatCard icon={Droplet} value="98.5%" label="Uptime" sub="Pipelines" tint="teal" />
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 font-semibold">Supply by Village</h3>
        <div className="flex flex-col gap-4">
          {villageSupply.map((v) => (
            <div key={v.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{v.name}</span>
                <span className="text-muted-foreground">{v.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${v.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
