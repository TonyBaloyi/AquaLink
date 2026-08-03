"use client"

import {
  UserRound,
  Bell,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"

const menu: { icon: LucideIcon; label: string }[] = [
  { icon: UserRound, label: "Account Details" },
  { icon: Bell, label: "Notifications" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Settings, label: "Preferences" },
  { icon: HelpCircle, label: "Help & Support" },
]

export function ProfileScreen({
  name,
  email,
  role,
  onLogout,
}: {
  name: string
  email: string
  role: string
  onLogout: () => void
}) {
  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-10 w-10" />
        </div>
        <h2 className="mt-3 text-lg font-bold">{name}</h2>
        <p className="text-sm text-muted-foreground">{email}</p>
        <span className="mt-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
          {role}
        </span>
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {menu.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/15"
      >
        <LogOut className="h-4 w-4" />
        Log Out
      </button>
    </div>
  )
}
