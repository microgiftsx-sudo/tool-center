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

    const body = (await request.json().catch(() => ({}))) as { reason?: string }
    const reason = String(body.reason ?? "").trim() || "rejected"

    const { id } = await context.params
    const requestId = Number(id)
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ message: "معرف الطلب غير صالح" }, { status: 400 })
    }

    const pool = getDbPool()
    const result = await pool.query(
      `UPDATE account_requests
       SET status = 'rejected',
           reviewed_by = $2,
           reviewed_at = NOW(),
           decision_note = $3
       WHERE id = $1
         AND status = 'pending'
       RETURNING id`,
      [requestId, user.id, reason]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "الطلب غير موجود أو تمت معالجته سابقًا" }, { status: 404 })
    }

    await writeAuditLog({
      actor: user,
      action: "account_requests.reject",
      targetType: "account_request",
      targetId: String(requestId),
      details: { reason },
    })

    return NextResponse.json({ status: "success", message: "تم رفض الطلب" })
  } catch (error) {
    return NextResponse.json({ message: "فشلت عملية الرفض", error: String(error) }, { status: 500 })
  }
}
