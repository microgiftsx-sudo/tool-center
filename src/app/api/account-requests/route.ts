import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { requirePermissionFromRequest } from "@/lib/api-route-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  return NextResponse.json({ message: "Not found" }, { status: 404 })
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
