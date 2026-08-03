import type { Status } from "@/lib/data"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
      )}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  )
}
