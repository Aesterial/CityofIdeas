export type RegisterPayload = {
  username: string
  password: string
  email: string
}

export type AuthorizationPayload = {
  usermail: string
  password: string
}

type ApiEmail = {
  address: string
  verified: boolean
}

type ApiRank = {
  name: string
  expires?: string | null
}

type ApiUserSettings = {
  display_name?: string | null
  session_live_time?: number | null
  avatar?: unknown
}

type ApiUser = {
  uid: number
  username: string
  email?: ApiEmail | null
  settings?: ApiUserSettings | null
  rank?: ApiRank | null
  joined?: string
}

export type AuthUser = {
  uid: number
  username: string
  email?: string
  displayName?: string
  rank?: ApiRank | null
  joined?: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL

function toAuthUser(user: ApiUser): AuthUser {
  return {
    uid: user.uid,
    username: user.username,
    email: user.email?.address,
    displayName: user.settings?.display_name ?? undefined,
    rank: user.rank ?? undefined,
    joined: user.joined,
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data?.error) {
        message = data.error
      }
    } catch {
      message = response.statusText || message
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await apiRequest("/api/login/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function authorizeUser(payload: AuthorizationPayload): Promise<void> {
  await apiRequest("/api/login/authorization", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const user = await apiRequest<ApiUser>("/api/user", { method: "GET" })
  return toAuthUser(user)
}

export async function updateDisplayName(uid: number, name: string): Promise<AuthUser> {
  const user = await apiRequest<ApiUser>(`/api/user/${uid}/name`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
  return toAuthUser(user)
}
