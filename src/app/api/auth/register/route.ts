import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { fullName?: string; userName?: string; role?: string; password?: string }
    const fullName = String(body.fullName ?? "").trim()
    const userName = String(body.userName ?? "").trim()
    const role = String(body.role ?? "").trim()
    const password = String(body.password ?? "")

    if (!fullName || !userName || !role || !password) {
      return NextResponse.json(
        { message: "الاسم واسم المستخدم والدور وكلمة المرور مطلوبة", code: "MISSING_FIELDS" },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(userName)) {
      return NextResponse.json(
        { message: "اسم المستخدم غير صالح (3-30 حرف: أحرف/أرقام/._-)", code: "INVALID_USERNAME", field: "userName" },
        { status: 400 }
      )
    }

    if (fullName.length < 2) {
      return NextResponse.json(
        { message: "الاسم الكامل قصير جدًا", code: "INVALID_FULLNAME", field: "fullName" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", code: "INVALID_PASSWORD", field: "password" },
        { status: 400 }
      )
    }

    const pool = getDbPool()

    const result = await pool.query(
      `INSERT INTO app_users (full_name, user_name, role, password_hash, is_temp_pass)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), false)
       RETURNING id, full_name, user_name, role, is_temp_pass`,
      [fullName, userName, role, password]
    )

    const row = result.rows[0]
    const accessToken = randomUUID()
    await pool.query(
      `INSERT INTO auth_sessions (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + interval '1 day')`,
      [accessToken, row.id]
    )

    return NextResponse.json({
      status: "success",
      data: {
        access_token: accessToken,
        user: {
          id: row.id as number,
          fullName: row.full_name as string,
          userName: row.user_name as string,
          role: row.role as string,
          isTempPass: row.is_temp_pass as boolean,
        },
      },
    })
  } catch (error) {
    const pgError = error as { code?: string; detail?: string }
    if (pgError.code === "23505") {
      return NextResponse.json(
        { message: "اسم المستخدم مستخدم بالفعل", code: "USERNAME_ALREADY_EXISTS", field: "userName" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { message: "فشل إنشاء الحساب", code: "REGISTER_FAILED", error: String(error) },
      { status: 500 }
    )
  }
}
