"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { LoginScreen, type Role } from "@/components/login-screen"
import { AdminApp } from "@/components/admin/admin-app"
import { SupplierApp } from "@/components/supplier/supplier-app"

export default function Page() {
  const [role, setRole] = useState<Role | null>(null)

  return (
    <AppShell>
      {role === null && <LoginScreen onLogin={setRole} />}
      {role === "admin" && <AdminApp onLogout={() => setRole(null)} />}
      {role === "supplier" && <SupplierApp onLogout={() => setRole(null)} />}
    </AppShell>
  )
}
