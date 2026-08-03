export type Status = "active" | "inactive"

export type Supplier = {
  id: string
  name: string
  email: string
  phone: string
  village: string
  status: Status
}

export type Household = {
  id: string
  family: string
  village: string
  supplier: string
  plan: string
  status: Status
}

export type Activity = {
  id: string
  kind: "household" | "payment" | "maintenance" | "supplier"
  title: string
  time: string
}

export type Notification = {
  id: string
  kind: "payment" | "maintenance" | "system"
  title: string
  detail: string
  time: string
}

export const suppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "John D. Borehole",
    email: "johndborehole@gmail.com",
    phone: "081 234 5678",
    village: "Makonde Village",
    status: "active",
  },
  {
    id: "SUP-002",
    name: "Green Valley Borehole",
    email: "greenvalley@gmail.com",
    phone: "082 456 7890",
    village: "Mavela Village",
    status: "active",
  },
  {
    id: "SUP-003",
    name: "Clear Water Borehole",
    email: "clearwater@gmail.com",
    phone: "083 456 7893",
    village: "Luphisi Village",
    status: "active",
  },
  {
    id: "SUP-004",
    name: "Hope Borehole",
    email: "hopeborehole@gmail.com",
    phone: "084 567 8901",
    village: "Nkosi Village",
    status: "inactive",
  },
  {
    id: "SUP-005",
    name: "Blue Spring Borehole",
    email: "bluespring@gmail.com",
    phone: "085 678 9012",
    village: "Kabokweni Village",
    status: "active",
  },
]

export const households: Household[] = [
  {
    id: "HOU-001",
    family: "Smith Family",
    village: "Makonde Village",
    supplier: "John D. Borehole",
    plan: "Standard Plan",
    status: "active",
  },
  {
    id: "HOU-002",
    family: "Mabaso Family",
    village: "Mavela Village",
    supplier: "Green Valley Borehole",
    plan: "Premium Plan",
    status: "active",
  },
  {
    id: "HOU-003",
    family: "Dlamini Household",
    village: "Luphisi Village",
    supplier: "Clear Water Borehole",
    plan: "Standard Plan",
    status: "active",
  },
  {
    id: "HOU-004",
    family: "Baloyi Family",
    village: "Bloavani Village",
    supplier: "Hope Borehole",
    plan: "Basic Plan",
    status: "inactive",
  },
  {
    id: "HOU-005",
    family: "Nkosi Household",
    village: "Mavela Village",
    supplier: "Green Valley Borehole",
    plan: "Standard Plan",
    status: "active",
  },
  {
    id: "HOU-006",
    family: "Sithole Family",
    village: "Kabokweni Village",
    supplier: "Blue Spring Borehole",
    plan: "Premium Plan",
    status: "active",
  },
]

export const adminActivities: Activity[] = [
  { id: "a1", kind: "household", title: "New household registered", time: "2 min ago" },
  { id: "a2", kind: "payment", title: "Payment received", time: "15 min ago" },
  { id: "a3", kind: "maintenance", title: "Maintenance request", time: "1 hour ago" },
  { id: "a4", kind: "supplier", title: "Supplier added", time: "2 hours ago" },
]

export const supplierNotifications: Notification[] = [
  {
    id: "n1",
    kind: "payment",
    title: "Payment received",
    detail: "R1,250 for April 2024",
    time: "2h ago",
  },
  {
    id: "n2",
    kind: "maintenance",
    title: "Maintenance request",
    detail: "Pipeline leakage reported",
    time: "1 day ago",
  },
  {
    id: "n3",
    kind: "system",
    title: "System update",
    detail: "Monthly report is ready",
    time: "3 days ago",
  },
]

export const adminStats = {
  totalSuppliers: 45,
  totalHouseholds: 320,
  activePipelines: 210,
  monthlyRevenue: "R52,000",
  pendingMaintenance: 12,
}

export const supplierStats = {
  name: "John",
  borehole: "Green Valley Borehole",
  waterSuppliedToday: "12,500 L",
  connectedHouseholds: 45,
  earningsToday: "R1,250",
  monthlyEarnings: "R37,500",
  waterUsed: 25000,
  waterTarget: 30000,
}

export const connectedHouseholds: Household[] = households.filter((h) => h.status === "active")
