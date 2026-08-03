"use client"

import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

export type SheetField = { label: string; value: string }

export function DetailSheet({
  open,
  onClose,
  title,
  subtitle,
  mode = "view",
  fields,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  mode?: "view" | "edit"
  fields: SheetField[]
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-t-3xl bg-card p-5 pb-8 shadow-xl animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-balance">{mode === "edit" ? `Edit ${title}` : title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{f.label}</label>
              {mode === "edit" ? (
                <input
                  defaultValue={f.value}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              ) : (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">{f.value}</p>
              )}
            </div>
          ))}
        </div>

        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Menu({
  open,
  onClose,
  items,
}: {
  open: boolean
  onClose: () => void
  items: { label: string; onClick: () => void; destructive?: boolean }[]
}) {
  if (!open) return null
  return (
    <>
      <button type="button" aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-40" />
      <div
        role="menu"
        className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              item.onClick()
              onClose()
            }}
            className={
              "block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent " +
              (item.destructive ? "text-danger" : "text-foreground")
            }
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}
