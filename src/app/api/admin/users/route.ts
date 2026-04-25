import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { requirePermissionFromRequest } from "@/lib/api-route-auth"
import { writeAuditLog } from "@/lib/audit-log"
import { isValidRole } from "@/lib/roles"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const auth = await requirePermissionFromRequest(request, "users:manage")
    if (!auth.ok) return auth.response
    const user = auth.user

    const body = (await request.json()) as { fullName?: string; email?: string; role?: string; password?: string }
    const fullName = String(body.fullName ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const role = String(body.role ?? "user").trim() || "user"
    const password = String(body.password ?? "").trim() || randomUUID().slice(0, 10)

    if (!fullName || !email) {
      return NextResponse.json({ message: "الاسم والبريد مطلوبان" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "البريد الإلكتروني غير صالح", field: "email" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", field: "password" }, { status: 400 })
    }
    if (!isValidRole(role)) {
      return NextResponse.json({ message: "الدور غير صالح", field: "role" }, { status: 400 })
    }

    const pool = getDbPool()
    await pool.query(
      `INSERT INTO app_users (user_name, full_name, role, password_hash, is_temp_pass)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), false)`,
      [email, fullName, role, password]
    )

    await writeAuditLog({
      actor: user,
      action: "users.create",
      targetType: "app_user",
      targetId: email,
      details: { fullName, role },
    })

    return NextResponse.json({
      status: "success",
      message: "تم إنشاء الحساب بنجاح",
      data: { email, password },
    })
  } catch (error) {
    const pgError = error as { code?: string }
    if (pgError.code === "23505") {
      return NextResponse.json({ message: "البريد مستخدم بالفعل" }, { status: 409 })
    }
    return NextResponse.json({ message: "فشل إنشاء الحساب", error: String(error) }, { status: 500 })
  }
}
