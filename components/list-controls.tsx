"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label={placeholder}
      />
    </div>
  )
}

export type Tab<T extends string> = { key: T; label: string; count: number }

export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab<T>[]
  active: T
  onChange: (key: T) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {tab.label} ({tab.count})
          </button>
        )
      })}
    </div>
  )
}
