import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { requirePermissionFromRequest } from "@/lib/api-route-auth"
import { writeAuditLog } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requirePermissionFromRequest(request, "account_requests:review")
    if (!auth.ok) return auth.response
    const user = auth.user

    const { id } = await context.params
    const requestId = Number(id)
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 })
    }

    const pool = getDbPool()
    const reqRes = await pool.query(
      `SELECT id, full_name, email, requested_role, status
       FROM account_requests
       WHERE id = $1
       LIMIT 1`,
      [requestId]
    )
    if (reqRes.rowCount === 0) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 })
    }

    const reqRow = reqRes.rows[0]
    if ((reqRow.status as string) !== "pending") {
      return NextResponse.json({ message: "تمت معالجة هذا الطلب مسبقًا" }, { status: 409 })
    }

    const tempPassword = randomUUID().slice(0, 10)
    await pool.query("BEGIN")
    try {
      await pool.query(
        `INSERT INTO app_users (user_name, full_name, role, password_hash, is_temp_pass)
         VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), true)`,
        [reqRow.email as string, reqRow.full_name as string, (reqRow.requested_role as string) || "user", tempPassword]
      )

      await pool.query(
        `UPDATE account_requests
         SET status = 'approved',
             reviewed_by = $2,
             reviewed_at = NOW(),
             decision_note = 'approved'
         WHERE id = $1`,
        [requestId, user.id]
      )
      await pool.query("COMMIT")
    } catch (error) {
      await pool.query("ROLLBACK")
      const pgError = error as { code?: string }
      if (pgError.code === "23505") {
        return NextResponse.json({ message: "هذا البريد مسجل بالفعل كمستخدم" }, { status: 409 })
      }
      throw error
    }

    await writeAuditLog({
      actor: user,
      action: "account_requests.approve",
      targetType: "account_request",
      targetId: String(requestId),
      details: { email: reqRow.email as string, requestedRole: reqRow.requested_role as string },
    })

    return NextResponse.json({
      status: "success",
      message: "تمت الموافقة وإنشاء الحساب",
      data: { email: reqRow.email as string, tempPassword },
    })
  } catch (error) {
    return NextResponse.json({ message: "فشلت عملية الموافقة", error: String(error) }, { status: 500 })
  }
}
