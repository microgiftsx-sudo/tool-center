import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { getSessionUserFromRequest } from "@/lib/auth-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUserFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "غير مصرح" }, { status: 403 })
    }

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

    return NextResponse.json({ status: "success", message: "تم رفض الطلب" })
  } catch (error) {
    return NextResponse.json({ message: "فشلت عملية الرفض", error: String(error) }, { status: 500 })
  }
}
