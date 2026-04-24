import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { extractBearerToken, getSessionUserFromToken } from "@/lib/auth-server"
import { writeAuditLog } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(request: Request) {
  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 401 })
    }

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
    const currentPassword = String(body.currentPassword ?? "")
    const newPassword = String(body.newPassword ?? "")

    if (!currentPassword || newPassword.length < 6) {
      return NextResponse.json({ message: "البيانات غير صحيحة" }, { status: 400 })
    }

    const pool = getDbPool()
    const sessionRes = await pool.query(
      `SELECT user_id
       FROM auth_sessions
       WHERE token = $1 AND expires_at > NOW()
       LIMIT 1`,
      [token]
    )

    if (sessionRes.rowCount === 0) {
      return NextResponse.json({ message: "انتهت الجلسة" }, { status: 401 })
    }

    const userId = sessionRes.rows[0].user_id as number
    const updateRes = await pool.query(
      `UPDATE app_users
       SET password_hash = crypt($1, gen_salt('bf')),
           is_temp_pass = false,
           updated_at = NOW()
       WHERE id = $2
         AND password_hash = crypt($3, password_hash)
       RETURNING id`,
      [newPassword, userId, currentPassword]
    )

    if (updateRes.rowCount === 0) {
      return NextResponse.json({ message: "كلمة المرور الحالية غير صحيحة" }, { status: 400 })
    }

    const actor = await getSessionUserFromToken(token)
    await writeAuditLog({
      actor,
      action: "users.change_own_password",
      targetType: "app_user",
      targetId: String(userId),
    })

    return NextResponse.json({
      status: "success",
      data: { success: true },
    })
  } catch (error) {
    return NextResponse.json(
      { message: "فشل تغيير كلمة المرور", error: String(error) },
      { status: 500 }
    )
  }
}
