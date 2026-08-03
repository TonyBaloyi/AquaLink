"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type NavItem = {
  key: string
  label: string
  icon: LucideIcon
}

export function BottomNav<T extends string>({
  items,
  active,
  onChange,
}: {
  items: (NavItem & { key: T })[]
  active: T
  onChange: (key: T) => void
}) {
  return (
    <nav
      className="sticky bottom-0 z-20 grid border-t border-border bg-card px-2 pb-3 pt-2"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
