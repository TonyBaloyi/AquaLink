import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({
  size = 56,
  withText = false,
  className,
  textClassName,
}: {
  size?: number
  withText?: boolean
  className?: string
  textClassName?: string
}) {
  const pad = Math.round(size * 0.12)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex items-center justify-center overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/5"
        style={{ padding: pad }}
      >
        <Image
          src="/aqualink-logo.png"
          alt="AquaLink logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {withText && <span className={cn("text-2xl font-bold tracking-tight", textClassName)}>AquaLink</span>}
    </div>
  )
}
