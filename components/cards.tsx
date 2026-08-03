"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Droplet, Home, Eye, Pencil, MoreHorizontal, Phone, Mail, MapPin, ChevronRight } from "lucide-react"
import type { Household, Supplier } from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { DetailSheet, Menu, type SheetField } from "@/components/detail-sheet"
import { cn } from "@/lib/utils"

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint = "primary",
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  tint?: "primary" | "teal" | "success" | "danger"
}) {
  const tintClass = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-accent-teal/15 text-accent-teal",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
  }[tint]
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg", tintClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function CardAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function CardActions({
  onView,
  onEdit,
  menuItems,
}: {
  onView: () => void
  onEdit: () => void
  menuItems: { label: string; onClick: () => void; destructive?: boolean }[]
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="mt-3 flex items-center gap-2">
      <CardAction icon={Eye} label="View" onClick={onView} />
      <CardAction icon={Pencil} label="Edit" onClick={onEdit} />
      <div className="relative">
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-lg border border-border px-2.5 py-1.5 text-foreground transition-colors hover:bg-accent"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <Menu open={menuOpen} onClose={() => setMenuOpen(false)} items={menuItems} />
      </div>
    </div>
  )
}

export function SupplierCard({ supplier }: { supplier: Supplier }) {
  const [sheet, setSheet] = useState<null | "view" | "edit">(null)
  const fields: SheetField[] = [
    { label: "Supplier ID", value: supplier.id },
    { label: "Name", value: supplier.name },
    { label: "Email", value: supplier.email },
    { label: "Phone", value: supplier.phone },
    { label: "Village", value: supplier.village },
    { label: "Status", value: supplier.status === "active" ? "Active" : "Inactive" },
  ]
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Droplet className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{supplier.id}</p>
              <h3 className="truncate font-semibold">{supplier.name}</h3>
            </div>
            <StatusBadge status={supplier.status} />
          </div>
          <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> {supplier.email}
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> {supplier.phone}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> {supplier.village}
            </p>
          </div>
        </div>
      </div>
      <CardActions
        onView={() => setSheet("view")}
        onEdit={() => setSheet("edit")}
        menuItems={[
          { label: "View details", onClick: () => setSheet("view") },
          { label: "Edit supplier", onClick: () => setSheet("edit") },
          { label: supplier.status === "active" ? "Deactivate" : "Activate", onClick: () => {}, destructive: true },
        ]}
      />
      <DetailSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={supplier.name}
        subtitle={supplier.id}
        mode={sheet === "edit" ? "edit" : "view"}
        fields={fields}
        footer={
          sheet === "edit" ? (
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save changes
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSheet("edit")}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Edit supplier
            </button>
          )
        }
      />
    </article>
  )
}

export function HouseholdCard({ household, showActions = true }: { household: Household; showActions?: boolean }) {
  const [sheet, setSheet] = useState<null | "view" | "edit">(null)
  const fields: SheetField[] = [
    { label: "Household ID", value: household.id },
    { label: "Family", value: household.family },
    { label: "Village", value: household.village },
    { label: "Supplier", value: household.supplier },
    { label: "Plan", value: household.plan },
    { label: "Status", value: household.status === "active" ? "Active" : "Inactive" },
  ]
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            household.status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
          )}
        >
          <Home className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{household.id}</p>
              <h3 className="truncate font-semibold">{household.family}</h3>
            </div>
            <StatusBadge status={household.status} />
          </div>
          <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            <p>{household.village}</p>
            <p>Supplier: {household.supplier}</p>
            <p>Plan: {household.plan}</p>
          </div>
        </div>
      </div>
      {showActions && (
        <CardActions
          onView={() => setSheet("view")}
          onEdit={() => setSheet("edit")}
          menuItems={[
            { label: "View details", onClick: () => setSheet("view") },
            { label: "Edit household", onClick: () => setSheet("edit") },
            {
              label: household.status === "active" ? "Deactivate" : "Activate",
              onClick: () => {},
              destructive: true,
            },
          ]}
        />
      )}
      <DetailSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={household.family}
        subtitle={household.id}
        mode={sheet === "edit" ? "edit" : "view"}
        fields={fields}
        footer={
          sheet === "edit" ? (
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save changes
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSheet("edit")}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Edit household
            </button>
          )
        }
      />
    </article>
  )
}

export function HouseholdRow({ household }: { household: Household }) {
  const [open, setOpen] = useState(false)
  const fields: SheetField[] = [
    { label: "Household ID", value: household.id },
    { label: "Family", value: household.family },
    { label: "Village", value: household.village },
    { label: "Supplier", value: household.supplier },
    { label: "Plan", value: household.plan },
    { label: "Status", value: household.status === "active" ? "Active" : "Inactive" },
  ]
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
          <Home className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{household.family}</h3>
            <StatusBadge status={household.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{household.village}</p>
          <p className="truncate text-xs text-muted-foreground">Plan: {household.plan}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </button>
      <DetailSheet
        open={open}
        onClose={() => setOpen(false)}
        title={household.family}
        subtitle={household.village}
        fields={fields}
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Close
          </button>
        }
      />
    </>
  )
}
