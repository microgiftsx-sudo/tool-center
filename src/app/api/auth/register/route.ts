import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { fullName?: string; userName?: string; role?: string }
    const fullName = String(body.fullName ?? "").trim()
    const userName = String(body.userName ?? "").trim()
    const role = String(body.role ?? "").trim()

    if (!fullName || !userName || !role) {
      return NextResponse.json(
        { message: "الاسم واسم المستخدم والدور مطلوبة", code: "MISSING_FIELDS" },
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

    const defaultPassword = randomUUID().slice(0, 8)
    const pool = getDbPool()

    const result = await pool.query(
      `INSERT INTO app_users (full_name, user_name, role, password_hash, is_temp_pass)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), true)
       RETURNING id, full_name, user_name, role, is_temp_pass`,
      [fullName, userName, role, defaultPassword]
    )

    const row = result.rows[0]
    return NextResponse.json({
      status: "success",
      data: {
        id: row.id as number,
        fullName: row.full_name as string,
        userName: row.user_name as string,
        role: row.role as string,
        isTempPass: row.is_temp_pass as boolean,
        defaultPassword,
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
