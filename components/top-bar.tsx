"use client"

import type { ReactNode } from "react"
import { Menu, ArrowLeft, Bell } from "lucide-react"

type TopBarProps = {
  title: string
  center?: ReactNode
  left?: "menu" | "back" | "none"
  onLeft?: () => void
  right?: ReactNode
  showBell?: boolean
}

export function TopBar({ title, center, left = "menu", onLeft, right, showBell }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-primary text-primary-foreground">
      <div className="flex items-center justify-between px-4 pb-4 pt-4">
        <div className="flex w-16 items-center">
          {left !== "none" && (
            <button
              type="button"
              onClick={onLeft}
              aria-label={left === "back" ? "Go back" : "Open menu"}
              className="-ml-1 rounded-md p-1 transition-colors hover:bg-primary-foreground/15"
            >
              {left === "back" ? <ArrowLeft className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
        {center ? (
          <div className="flex flex-1 items-center justify-center">{center}</div>
        ) : (
          <h1 className="flex-1 truncate text-center text-lg font-semibold">{title}</h1>
        )}
        <div className="flex w-16 items-center justify-end gap-2">
          {showBell && (
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-md p-1 transition-colors hover:bg-primary-foreground/15"
            >
              <Bell className="h-6 w-6" />
            </button>
          )}
          {right}
        </div>
      </div>
    </header>
  )
}
