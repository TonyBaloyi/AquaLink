import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AquaLink — Water Network",
  description: "AquaLink water distribution management platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
