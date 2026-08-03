"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { SearchBar, SegmentedTabs, type Tab } from "@/components/list-controls"
import { SupplierCard } from "@/components/cards"
import { suppliers, type Status } from "@/lib/data"

type Filter = "all" | Status

export function SuppliersScreen() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const tabs: Tab<Filter>[] = [
    { key: "all", label: "All", count: suppliers.length },
    { key: "active", label: "Active", count: suppliers.filter((s) => s.status === "active").length },
    { key: "inactive", label: "Inactive", count: suppliers.filter((s) => s.status === "inactive").length },
  ]

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesFilter = filter === "all" || s.status === filter
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.village.toLowerCase().includes(query.toLowerCase())
      return matchesFilter && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} placeholder="Search suppliers..." />
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      <SegmentedTabs tabs={tabs} active={filter} onChange={setFilter} />

      <div className="flex flex-col gap-3">
        {filtered.map((s) => (
          <SupplierCard key={s.id} supplier={s} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No suppliers found.</p>
        )}
      </div>
    </div>
  )
}
