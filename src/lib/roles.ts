export const ALLOWED_ROLES = ["admin", "support", "user"] as const

export type AppRole = (typeof ALLOWED_ROLES)[number]

export function isValidRole(value: string): value is AppRole {
  return ALLOWED_ROLES.includes(value as AppRole)
}
