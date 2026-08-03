"use client"

import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserRound } from "lucide-react"
import { Logo } from "@/components/brand"
import { cn } from "@/lib/utils"

export type Role = "admin" | "supplier"

export function LoginScreen({ onLogin }: { onLogin: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("admin")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-accent/60 to-background">
      <div className="flex flex-1 flex-col px-6 pb-10 pt-10">
        <div className="flex flex-col items-center text-center">
          <Logo size={72} />
          <span className="mt-2 text-2xl font-bold tracking-tight text-primary">AquaLink</span>
          <p className="text-sm text-muted-foreground">Clean Water Management</p>
          <h1 className="mt-6 text-lg font-semibold">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">Login into your AquaLink Account</p>
        </div>

        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onLogin(role)
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">User Type</label>
            <div className="grid grid-cols-2 gap-3">
              <RoleButton
                active={role === "admin"}
                onClick={() => setRole("admin")}
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Admin"
              />
              <RoleButton
                active={role === "supplier"}
                onClick={() => setRole("supplier")}
                icon={<UserRound className="h-4 w-4" />}
                label="Supplier"
              />
            </div>
          </div>

          <Field label="Email Address">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="Enter your email address"
              defaultValue={role === "admin" ? "admin@aqualink.co" : "john@greenvalley.co"}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field label="Password">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter Your password"
              defaultValue="password"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Remember me
            </label>
            <button type="button" className="font-medium text-primary">
              Forgot Password ?
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

function RoleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {children}
      </div>
    </div>
  )
}
