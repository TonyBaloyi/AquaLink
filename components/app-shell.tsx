import type { ReactNode } from "react"

/**
 * Centers the phone-sized app in the middle of the viewport on desktop,
 * while filling the full width on mobile / the responsive toggle.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-muted">
      <div className="relative flex w-full max-w-[430px] flex-col bg-background shadow-xl">{children}</div>
    </div>
  )
}
