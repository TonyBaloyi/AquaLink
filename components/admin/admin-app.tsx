"use client"

import { useState } from "react"
import { LayoutDashboard, Droplet, Home, FileBarChart, UserRound } from "lucide-react"
import { TopBar } from "@/components/top-bar"
import { BottomNav, type NavItem } from "@/components/bottom-nav"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { SuppliersScreen } from "@/components/admin/suppliers-screen"
import { HouseholdsScreen } from "@/components/admin/households-screen"
import { ReportsScreen } from "@/components/admin/reports-screen"
import { ProfileScreen } from "@/components/profile-screen"

type AdminTab = "dashboard" | "suppliers" | "households" | "reports" | "profile"

const navItems: (NavItem & { key: AdminTab })[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "suppliers", label: "Suppliers", icon: Droplet },
  { key: "households", label: "Households", icon: Home },
  { key: "reports", label: "Reports", icon: FileBarChart },
  { key: "profile", label: "Profile", icon: UserRound },
]

const titles: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  suppliers: "Suppliers",
  households: "Households",
  reports: "Reports",
  profile: "Profile",
}

export function AdminApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("dashboard")

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        title={titles[tab]}
        left="menu"
        showBell
        right={
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
            A
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto">
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "suppliers" && <SuppliersScreen />}
        {tab === "households" && <HouseholdsScreen />}
        {tab === "reports" && <ReportsScreen />}
        {tab === "profile" && (
          <ProfileScreen name="Admin User" email="admin@aqualink.co" role="Administrator" onLogout={onLogout} />
        )}
      </main>

      <BottomNav items={navItems} active={tab} onChange={setTab} />
    </div>
  )
}
