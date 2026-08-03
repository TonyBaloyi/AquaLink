"use client"

import { useState } from "react"
import { LayoutDashboard, Home, Bell, UserRound } from "lucide-react"
import { TopBar } from "@/components/top-bar"
import { BottomNav, type NavItem } from "@/components/bottom-nav"
import { Logo } from "@/components/brand"
import { SupplierDashboard } from "@/components/supplier/supplier-dashboard"
import { ConnectedHouseholds } from "@/components/supplier/connected-households"
import { NotificationsScreen } from "@/components/supplier/notifications-screen"
import { ProfileScreen } from "@/components/profile-screen"

type SupplierTab = "dashboard" | "households" | "notifications" | "profile"

const navItems: (NavItem & { key: SupplierTab })[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "households", label: "Households", icon: Home },
  { key: "notifications", label: "Alerts", icon: Bell },
  { key: "profile", label: "Profile", icon: UserRound },
]

export function SupplierApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<SupplierTab>("dashboard")

  const isDashboard = tab === "dashboard"

  return (
    <div className="flex min-h-screen flex-col">
      {isDashboard ? (
        <TopBar
          title="AquaLink"
          center={
            <div className="flex items-center gap-1.5">
              <Logo size={28} />
              <span className="text-lg font-bold">AquaLink</span>
            </div>
          }
          left="menu"
          right={
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
              J
            </div>
          }
        />
      ) : (
        <TopBar
          title={
            tab === "households" ? "Connected Households" : tab === "notifications" ? "Notifications" : "Profile"
          }
          left="back"
          onLeft={() => setTab("dashboard")}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        {tab === "dashboard" && <SupplierDashboard />}
        {tab === "households" && <ConnectedHouseholds />}
        {tab === "notifications" && <NotificationsScreen />}
        {tab === "profile" && (
          <ProfileScreen
            name="John Dlamini"
            email="john@greenvalley.co"
            role="Water Supplier"
            onLogout={onLogout}
          />
        )}
      </main>

      <BottomNav items={navItems} active={tab} onChange={setTab} />
    </div>
  )
}
