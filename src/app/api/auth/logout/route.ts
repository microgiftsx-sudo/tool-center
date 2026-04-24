import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { extractBearerToken, getSessionUserFromToken } from "@/lib/auth-server"
import { writeAuditLog } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request)
    if (!token) return NextResponse.json({ ok: true })
    const actor = await getSessionUserFromToken(token)

    const pool = getDbPool()
    await pool.query("DELETE FROM auth_sessions WHERE token = $1", [token])
    await writeAuditLog({
      actor,
      action: "auth.logout",
      targetType: "auth_session",
      targetId: token,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: "فشل تسجيل الخروج", error: String(error) },
      { status: 500 }
    )
  }
}
