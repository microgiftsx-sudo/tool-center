import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userName?: string; password?: string }
    const userName = String(body.userName ?? "").trim()
    const password = String(body.password ?? "")

    if (!userName || !password) {
      return NextResponse.json(
        { message: "اسم المستخدم وكلمة المرور مطلوبة", code: "MISSING_CREDENTIALS" },
        { status: 400 }
      )
    }

    const pool = getDbPool()
    const userRes = await pool.query(
      `SELECT id, user_name, full_name, role, is_temp_pass, password_hash
       FROM app_users
       WHERE lower(user_name) = lower($1)
       LIMIT 1`,
      [userName]
    )

    if (userRes.rowCount === 0) {
      return NextResponse.json(
        { message: "اسم المستخدم غير موجود", code: "USER_NOT_FOUND", field: "userName" },
        { status: 401 }
      )
    }

    const row = userRes.rows[0]
    const passwordRes = await pool.query(
      "SELECT crypt($1, $2) = $2 AS valid",
      [password, row.password_hash as string]
    )

    const isValidPassword = Boolean(passwordRes.rows[0]?.valid)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "كلمة المرور غير صحيحة", code: "INVALID_PASSWORD", field: "password" },
        { status: 401 }
      )
    }

    const accessToken = randomUUID()
    const sessionRes = await pool.query(
      `INSERT INTO auth_sessions (token, user_id, expires_at)
       VALUES ($1, $2, NOW() + interval '1 day')
       RETURNING token`,
      [accessToken, row.id]
    )

    if (sessionRes.rowCount === 0) {
      return NextResponse.json(
        { message: "تعذر إنشاء جلسة الدخول، حاول مرة أخرى", code: "SESSION_CREATE_FAILED" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: "success",
      data: {
        access_token: accessToken,
        user: {
          id: row.id as number,
          userName: row.user_name as string,
          fullName: row.full_name as string,
          role: row.role as string,
          isTempPass: row.is_temp_pass as boolean,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: "فشل تسجيل الدخول", code: "LOGIN_FAILED", error: String(error) },
      { status: 500 }
    )
  }
}
