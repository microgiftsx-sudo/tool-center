import type { SessionUser } from "@/lib/auth-server"

export type AppPermission =
  | "account_requests:review"
  | "users:read"
  | "users:manage"
  | "maintenance:read"
  | "maintenance:manage"
  | "audit_logs:read"

const rolePermissions: Record<string, AppPermission[]> = {
  admin: [
    "account_requests:review",
    "users:read",
    "users:manage",
    "maintenance:read",
    "maintenance:manage",
    "audit_logs:read",
  ],
  support: ["account_requests:review", "users:read", "maintenance:read", "audit_logs:read"],
  user: [],
}

export function hasPermission(user: SessionUser | null, permission: AppPermission): boolean {
  if (!user) return false
  const permissions = rolePermissions[user.role] ?? []
  return permissions.includes(permission)
}
