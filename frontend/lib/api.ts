const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

type ApiEnvelope<T> = { success: boolean; data: T; meta?: any }

export class ApiClientError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("aqualink_access_token")
}

export function saveSession(data: any) {
  if (typeof window === "undefined") return
  localStorage.setItem("aqualink_access_token", data.accessToken)
  if (data.refreshToken) localStorage.setItem("aqualink_refresh_token", data.refreshToken)
  if (data.user) localStorage.setItem("aqualink_user", JSON.stringify(data.user))
  if (data.profile) localStorage.setItem("aqualink_profile", JSON.stringify(data.profile))
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem("aqualink_access_token")
  localStorage.removeItem("aqualink_refresh_token")
  localStorage.removeItem("aqualink_user")
  localStorage.removeItem("aqualink_profile")
}

export function getStoredUser() {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("aqualink_user") || "null") } catch { return null }
}

export function getStoredProfile() {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("aqualink_profile") || "null") } catch { return null }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) throw new ApiClientError("NEXT_PUBLIC_API_BASE_URL is not configured.", 0)
  const token = getAccessToken()
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const text = await res.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch {}
  if (!res.ok) {
    throw new ApiClientError(body?.error?.message || body?.message || `Request failed (${res.status})`, res.status)
  }
  return (body && "data" in body ? body.data : body) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) => request<T>(path, { method:"POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: any) => request<T>(path, { method:"PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method:"DELETE" }),
}

export const authApi = {
  login: (body: any) => api.post<any>("/auth/login", body),
  me: () => api.get<any>("/auth/me"),
  logout: () => api.post<any>("/auth/logout", {}),
  forgotPassword: (email: string) => api.post<any>("/auth/forgot-password", { email }),
}
