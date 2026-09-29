import { api } from "./api"

export const supplierService = {
  list: (params = "") => api.get<any>(`/suppliers${params ? `?${params}` : ""}`),
  get: (id: string) => api.get<any>(`/suppliers/${id}`),
  dashboard: (id?: string) => api.get<any>(id ? `/suppliers/${id}/dashboard` : "/suppliers/me/dashboard"),
  create: (body: any) => api.post<any>("/suppliers", body),
  update: (id: string, body: any) => api.patch<any>(`/suppliers/${id}`, body),
  remove: (id: string) => api.delete<any>(`/suppliers/${id}`),
}

export const householdService = {
  list: (params = "") => api.get<any>(`/households${params ? `?${params}` : ""}`),
  get: (id: string) => api.get<any>(`/households/${id}`),
  summary: (id: string) => api.get<any>(`/households/${id}/summary`),
  create: (body: any) => api.post<any>("/households", body),
  update: (id: string, body: any) => api.patch<any>(`/households/${id}`, body),
  remove: (id: string) => api.delete<any>(`/households/${id}`),
}

export const boreholeService = {
  list: (params = "") => api.get<any>(`/boreholes${params ? `?${params}` : ""}`),
  get: (id: string) => api.get<any>(`/boreholes/${id}`),
  tank: (id: string) => api.get<any>(`/boreholes/${id}/tank`),
  create: (body: any) => api.post<any>("/boreholes", body),
  update: (id: string, body: any) => api.patch<any>(`/boreholes/${id}`, body),
  remove: (id: string) => api.delete<any>(`/boreholes/${id}`),
}

export const subscriptionService = {
  plans: () => api.get<any[]>("/subscriptions/plans"),
  list: (params = "") => api.get<any>(`/subscriptions${params ? `?${params}` : ""}`),
  subscribe: (body: any) => api.post<any>("/subscriptions", body),
  updateStatus: (id: string, status: string) => api.patch<any>(`/subscriptions/${id}/status`, { status }),
  changePlan: (id: string, plan_id: string) => api.patch<any>(`/subscriptions/${id}/plan`, { plan_id }),
}

export const paymentService = {
  list: (params = "") => api.get<any>(`/payments${params ? `?${params}` : ""}`),
  get: (id: string) => api.get<any>(`/payments/${id}`),
  invoice: (body: any) => api.post<any>("/payments/invoices", body),
  pay: (id: string, method: string) => api.post<any>(`/payments/${id}/pay`, { method }),
  markPaid: (id: string, reference?: string) => api.patch<any>(`/payments/${id}/mark-paid`, { reference }),
}

export const readingService = {
  list: (params = "") => api.get<any[]>(`/readings${params ? `?${params}` : ""}`),
  usage: (params = "") => api.get<any[]>(`/readings/usage${params ? `?${params}` : ""}`),
}

export const alertService = {
  list: (params = "") => api.get<any>(`/alerts${params ? `?${params}` : ""}`),
  acknowledge: (id: string) => api.patch<any>(`/alerts/${id}/acknowledge`, {}),
  resolve: (id: string) => api.patch<any>(`/alerts/${id}/resolve`, {}),
  create: (body: any) => api.post<any>("/alerts", body),
}

export const reportService = {
  overview: () => api.get<any>("/reports/overview"),
  usage: (params = "") => api.get<any[]>(`/reports/usage${params ? `?${params}` : ""}`),
  revenue: (params = "") => api.get<any[]>(`/reports/revenue${params ? `?${params}` : ""}`),
  alerts: (params = "") => api.get<any[]>(`/reports/alerts${params ? `?${params}` : ""}`),
  topConsumers: (params = "") => api.get<any[]>(`/reports/top-consumers${params ? `?${params}` : ""}`),
}

export const userService = {
  list: (params = "") => api.get<any>(`/users${params ? `?${params}` : ""}`),
  create: (body: any) => api.post<any>("/users", body),
  update: (id: string, body: any) => api.patch<any>(`/users/${id}`, body),
  status: (id: string, status: string) => api.patch<any>(`/users/${id}/status`, { status }),
  remove: (id: string) => api.delete<any>(`/users/${id}`),
}
