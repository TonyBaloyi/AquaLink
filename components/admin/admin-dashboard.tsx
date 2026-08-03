"use client"

import {
  Users,
  Home,
  Waves,
  Wallet,
  Wrench,
  UserPlus,
  CreditCard,
  UserCheck,
  type LucideIcon,
} from "lucide-react"
import { StatCard } from "@/components/cards"
import { adminStats, adminActivities, type Activity } from "@/lib/data"

const activityIcon: Record<Activity["kind"], { icon: LucideIcon; tint: string }> = {
  household: { icon: UserPlus, tint: "bg-primary/10 text-primary" },
  payment: { icon: CreditCard, tint: "bg-success/15 text-success" },
  maintenance: { icon: Wrench, tint: "bg-danger/15 text-danger" },
  supplier: { icon: UserCheck, tint: "bg-accent-teal/15 text-accent-teal" },
}

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div>
        <h2 className="text-xl font-bold">Welcome, Admin</h2>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your system today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          value={String(adminStats.totalSuppliers)}
          label="Total Suppliers"
          sub="Active Suppliers"
          tint="primary"
        />
        <StatCard
          icon={Home}
          value={String(adminStats.totalHouseholds)}
          label="Total Households"
          sub="Registered Households"
          tint="teal"
        />
        <StatCard
          icon={Waves}
          value={String(adminStats.activePipelines)}
          label="Active Pipelines"
          sub="Connected Pipelines"
          tint="success"
        />
        <StatCard
          icon={Wallet}
          value={adminStats.monthlyRevenue}
          label="Monthly Revenue"
          sub="This Month"
          tint="primary"
        />
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-danger/15 text-danger">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-tight">{adminStats.pendingMaintenance}</p>
          <p className="text-sm font-medium">Pending Maintenance</p>
          <p className="text-xs text-muted-foreground">Requests</p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Recent Activities</h3>
          <button type="button" className="text-sm font-medium text-primary">
            View All
          </button>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {adminActivities.map((a) => {
            const { icon: Icon, tint } = activityIcon[a.kind]
            return (
              <div key={a.id} className="flex items-center gap-3 p-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
