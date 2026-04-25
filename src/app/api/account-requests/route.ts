import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { requirePermissionFromRequest } from "@/lib/api-route-auth"
import { isValidRole } from "@/lib/roles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string
      email?: string
      requestedRole?: string
      notes?: string
    }

    const fullName = String(body.fullName ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const requestedRole = String(body.requestedRole ?? "user").trim()
    const notes = String(body.notes ?? "").trim()

    if (!fullName || !email) {
      return NextResponse.json(
        { message: "الاسم الكامل والبريد الإلكتروني مطلوبان", field: !fullName ? "fullName" : "email" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "البريد الإلكتروني غير صالح", field: "email" }, { status: 400 })
    }
    if (!isValidRole(requestedRole)) {
      return NextResponse.json({ message: "الدور المطلوب غير صالح", field: "requestedRole" }, { status: 400 })
    }

    const pool = getDbPool()
    const existingUser = await pool.query("SELECT id FROM app_users WHERE lower(user_name) = lower($1) LIMIT 1", [email])
    if ((existingUser.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { message: "هذا البريد مسجل بالفعل، تواصل مع الإدارة لاستعادة الوصول", field: "email" },
        { status: 409 }
      )
    }

    const existingPending = await pool.query(
      "SELECT id FROM account_requests WHERE lower(email) = lower($1) AND status = 'pending' LIMIT 1",
      [email]
    )
    if ((existingPending.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { message: "يوجد طلب قيد المراجعة لهذا البريد بالفعل", field: "email" },
        { status: 409 }
      )
    }

    await pool.query(
      `INSERT INTO account_requests (full_name, email, requested_role, notes, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [fullName, email, requestedRole, notes || null]
    )

    return NextResponse.json({ status: "success", message: "تم إرسال طلب الحساب بنجاح" })
  } catch (error) {
    return NextResponse.json({ message: "تعذر إرسال الطلب", error: String(error) }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requirePermissionFromRequest(request, "account_requests:review")
    if (!auth.ok) return auth.response

    const pool = getDbPool()
    const result = await pool.query(
      `SELECT id, full_name, email, requested_role, notes, status, created_at, reviewed_at, decision_note
       FROM account_requests
       ORDER BY created_at DESC
       LIMIT 200`
    )

    return NextResponse.json({
      status: "success",
      data: result.rows.map((row) => ({
        id: row.id as number,
        fullName: row.full_name as string,
        email: row.email as string,
        requestedRole: row.requested_role as string,
        notes: (row.notes as string | null) ?? "",
        status: row.status as "pending" | "approved" | "rejected",
        createdAt: row.created_at as string,
        reviewedAt: (row.reviewed_at as string | null) ?? null,
        decisionNote: (row.decision_note as string | null) ?? null,
      })),
    })
  } catch (error) {
    return NextResponse.json({ message: "فشل جلب الطلبات", error: String(error) }, { status: 500 })
  }
}
