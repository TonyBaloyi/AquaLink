"use client"

import { useMemo, useState } from "react"
import { UserPlus } from "lucide-react"
import { SearchBar, SegmentedTabs, type Tab } from "@/components/list-controls"
import { HouseholdCard } from "@/components/cards"
import { households, type Status } from "@/lib/data"

type Filter = "all" | Status

export function HouseholdsScreen() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const tabs: Tab<Filter>[] = [
    { key: "all", label: "All", count: households.length },
    { key: "active", label: "Active", count: households.filter((h) => h.status === "active").length },
    { key: "inactive", label: "Inactive", count: households.filter((h) => h.status === "inactive").length },
  ]

  const filtered = useMemo(() => {
    return households.filter((h) => {
      const matchesFilter = filter === "all" || h.status === filter
      const matchesQuery =
        h.family.toLowerCase().includes(query.toLowerCase()) ||
        h.village.toLowerCase().includes(query.toLowerCase())
      return matchesFilter && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} placeholder="Search households..." />
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4" />
          Register
        </button>
      </div>

      <SegmentedTabs tabs={tabs} active={filter} onChange={setFilter} />

      <div className="flex flex-col gap-3">
        {filtered.map((h) => (
          <HouseholdCard key={h.id} household={h} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No households found.</p>
        )}
      </div>
    </div>
  )
}
