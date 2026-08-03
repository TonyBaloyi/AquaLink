"use client"

import { Droplet, Home, DollarSign, TrendingUp, CreditCard, Wrench, RefreshCw, type LucideIcon } from "lucide-react"
import { supplierStats, supplierNotifications, type Notification } from "@/lib/data"

const notifIcon: Record<Notification["kind"], { icon: LucideIcon; tint: string }> = {
  payment: { icon: CreditCard, tint: "bg-success/15 text-success" },
  maintenance: { icon: Wrench, tint: "bg-danger/15 text-danger" },
  system: { icon: RefreshCw, tint: "bg-primary/10 text-primary" },
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub: string
  tint: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  )
}

export function SupplierDashboard() {
  const pct = Math.round((supplierStats.waterUsed / supplierStats.waterTarget) * 100)

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div>
        <h2 className="text-xl font-bold">Welcome, {supplierStats.name}</h2>
        <p className="text-sm text-muted-foreground">{supplierStats.borehole}</p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Today&apos;s Overview</h3>
          <span className="text-xs text-muted-foreground">May 20, 2024</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat
            icon={Droplet}
            label="Water Supplied Today"
            value={supplierStats.waterSuppliedToday}
            sub="Liters"
            tint="bg-accent-teal/15 text-accent-teal"
          />
          <MiniStat
            icon={Home}
            label="Connected Households"
            value={String(supplierStats.connectedHouseholds)}
            sub="Households"
            tint="bg-primary/10 text-primary"
          />
          <MiniStat
            icon={DollarSign}
            label="Earnings Today"
            value={supplierStats.earningsToday}
            sub="Rand"
            tint="bg-success/15 text-success"
          />
          <MiniStat
            icon={TrendingUp}
            label="Monthly Earnings"
            value={supplierStats.monthlyEarnings}
            sub="This month"
            tint="bg-primary/10 text-primary"
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Water Supply</h3>
          <span className="text-xs text-muted-foreground">This Month</span>
        </div>
        <div className="mb-1 flex items-end justify-between">
          <span className="text-sm text-muted-foreground">{pct}% of monthly target</span>
          <span className="text-sm font-semibold">
            {supplierStats.waterUsed.toLocaleString()} / {supplierStats.waterTarget.toLocaleString()} L
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent Notifications</h3>
          <button type="button" className="text-sm font-medium text-primary">
            View All
          </button>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {supplierNotifications.map((n) => {
            const { icon: Icon, tint } = notifIcon[n.kind]
            return (
              <div key={n.id} className="flex items-center gap-3 p-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
