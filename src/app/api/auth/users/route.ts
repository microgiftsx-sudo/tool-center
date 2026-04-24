import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { requirePermissionFromRequest } from "@/lib/api-route-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const auth = await requirePermissionFromRequest(request, "users:read")
    if (!auth.ok) return auth.response

    const pool = getDbPool()
    const result = await pool.query(
      `SELECT id, user_name, full_name, role, is_temp_pass, created_at, updated_at
       FROM app_users
       ORDER BY id DESC
       LIMIT 100`
    )

    const items = result.rows.map((row) => ({
      id: row.id as number,
      userName: row.user_name as string,
      fullName: row.full_name as string,
      role: row.role as string,
      isTempPass: row.is_temp_pass as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }))

    return NextResponse.json({
      status: "success",
      data: {
        items,
        pagination: {
          current_page: 1,
          per_page: items.length,
          total_items: items.length,
          total_pages: 1,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: "فشل جلب المستخدمين", error: String(error) },
      { status: 500 }
    )
  }
}
