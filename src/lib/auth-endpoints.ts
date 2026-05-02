const remoteAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_REMOTE_AUTH === "true"

function normalizeBaseUrl(url: string | undefined): string {
  if (!url) return ""
  return url.trim().replace(/\/+$/, "")
}

function withBase(baseUrl: string, path: string): string {
  if (!baseUrl) return path
  return `${baseUrl}${path}`
}

const remoteAuthBaseUrl = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
)

export function isRemoteAuthEnabled(): boolean {
  return remoteAuthEnabled
}

export function getAuthEndpoint(type: "login" | "changePassword" | "me" | "users" | "register" | "resetPassword"): string {
  if (!remoteAuthEnabled) {
    switch (type) {
      case "login":
        return "/api/auth/login"
      case "changePassword":
        return "/api/auth/change-password"
      case "me":
        return "/api/auth/me"
      case "users":
        return "/api/auth/users"
      case "register":
        return "/api/auth/register"
      case "resetPassword":
        return "/api/auth/reset-password"
    }
  }

  switch (type) {
    case "login":
      return withBase(remoteAuthBaseUrl, "/auth/login")
    case "changePassword":
      return withBase(remoteAuthBaseUrl, "/auth/change-password")
    case "me":
      return withBase(remoteAuthBaseUrl, "/auth/me")
    case "users":
      return withBase(remoteAuthBaseUrl, "/users")
    case "register":
      // Current external API does not expose register; keep local flow.
      return "/api/auth/register"
    case "resetPassword":
      // Current external API does not expose reset-password; keep local flow.
      return "/api/auth/reset-password"
  }
}
