"use client"

import { CreditCard, Wrench, RefreshCw, type LucideIcon } from "lucide-react"
import { supplierNotifications, type Notification } from "@/lib/data"

const notifIcon: Record<Notification["kind"], { icon: LucideIcon; tint: string }> = {
  payment: { icon: CreditCard, tint: "bg-success/15 text-success" },
  maintenance: { icon: Wrench, tint: "bg-danger/15 text-danger" },
  system: { icon: RefreshCw, tint: "bg-primary/10 text-primary" },
}

export function NotificationsScreen() {
  return (
    <div className="flex flex-col gap-3 px-4 py-5">
      {supplierNotifications.map((n) => {
        const { icon: Icon, tint } = notifIcon[n.kind]
        return (
          <div key={n.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{n.title}</p>
                <span className="text-xs text-muted-foreground">{n.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{n.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
