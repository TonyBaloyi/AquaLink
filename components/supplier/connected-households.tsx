"use client"

import { useMemo, useState } from "react"
import { SearchBar } from "@/components/list-controls"
import { HouseholdRow } from "@/components/cards"
import { connectedHouseholds } from "@/lib/data"

export function ConnectedHouseholds() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () =>
      connectedHouseholds.filter(
        (h) =>
          h.family.toLowerCase().includes(query.toLowerCase()) ||
          h.village.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <SearchBar value={query} onChange={setQuery} placeholder="Search households..." />

      <div className="flex flex-col gap-3">
        {filtered.map((h) => (
          <HouseholdRow key={h.id} household={h} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No households found.</p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-sm font-medium">Total Households</span>
        <span className="text-lg font-bold text-primary">{connectedHouseholds.length}</span>
      </div>
    </div>
  )
}
