import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { getSessionUserFromRequest } from "@/lib/auth-server"
import { hasPermission } from "@/lib/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request)
    if (!hasPermission(user, "audit_logs:read")) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 403 })
    }

    const url = new URL(request.url)
    const q = String(url.searchParams.get("q") ?? "").trim().toLowerCase()
    const action = String(url.searchParams.get("action") ?? "").trim()
    const limitRaw = Number(url.searchParams.get("limit") ?? 100)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100

    const pool = getDbPool()
    const result = await pool.query(
      `SELECT id, actor_user_id, actor_user_name, actor_role, action, target_type, target_id, details, created_at
       FROM audit_logs
       WHERE ($1 = '' OR action = $1)
         AND (
           $2 = ''
           OR lower(coalesce(actor_user_name, '')) LIKE ('%' || $2 || '%')
           OR lower(coalesce(action, '')) LIKE ('%' || $2 || '%')
           OR lower(coalesce(target_type, '')) LIKE ('%' || $2 || '%')
           OR lower(coalesce(target_id, '')) LIKE ('%' || $2 || '%')
         )
       ORDER BY created_at DESC
       LIMIT $3`,
      [action, q, limit]
    )

    return NextResponse.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id as number,
        actorUserId: row.actor_user_id as number | null,
        actorUserName: (row.actor_user_name as string | null) ?? "",
        actorRole: (row.actor_role as string | null) ?? "",
        action: row.action as string,
        targetType: (row.target_type as string | null) ?? "",
        targetId: (row.target_id as string | null) ?? "",
        details: (row.details as Record<string, unknown> | null) ?? {},
        createdAt: row.created_at as string,
      })),
    })
  } catch (error) {
    return NextResponse.json({ message: "تعذر تحميل سجل التدقيق", error: String(error) }, { status: 500 })
  }
}
