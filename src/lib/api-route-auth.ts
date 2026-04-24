import { NextResponse } from "next/server"
import { getSessionUserFromRequest } from "@/lib/auth-server"
import { hasPermission } from "@/lib/permissions"
import type { AppPermission } from "@/lib/permissions"
import type { SessionUser } from "@/lib/auth-server"

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse }

export async function requirePermissionFromRequest(
  request: Request,
  permission: AppPermission
): Promise<AuthResult> {
  const user = await getSessionUserFromRequest(request)
  if (!user || !hasPermission(user, permission)) {
    return { ok: false, response: NextResponse.json({ message: "غير مصرح" }, { status: 403 }) }
  }
  return { ok: true, user }
}
