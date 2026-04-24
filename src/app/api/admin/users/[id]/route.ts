import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { getSessionUserFromRequest } from "@/lib/auth-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUserFromRequest(request)
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ message: "غير مصرح" }, { status: 403 })
    }

    const { id } = await context.params
    const userId = Number(id)
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ message: "معرف المستخدم غير صالح" }, { status: 400 })
    }

    const body = (await request.json()) as {
      fullName?: string
      userName?: string
      role?: string
      isTempPass?: boolean
      password?: string
    }

    const fullName = String(body.fullName ?? "").trim()
    const userName = String(body.userName ?? "").trim().toLowerCase()
    const role = String(body.role ?? "").trim()
    const isTempPass = Boolean(body.isTempPass)
    const password = String(body.password ?? "").trim()

    if (!fullName || !userName || !role) {
      return NextResponse.json(
        { message: "الاسم الكامل واسم المستخدم والدور مطلوبة" },
        { status: 400 }
      )
    }
    if (password && password.length < 6) {
      return NextResponse.json(
        { message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      )
    }

    const pool = getDbPool()
    const updated = password
      ? await pool.query(
          `UPDATE app_users
           SET full_name = $1,
               user_name = $2,
               role = $3,
               is_temp_pass = $4,
               password_hash = crypt($5, gen_salt('bf')),
               updated_at = NOW()
           WHERE id = $6
           RETURNING id, user_name, full_name, role, is_temp_pass, created_at, updated_at`,
          [fullName, userName, role, isTempPass, password, userId]
        )
      : await pool.query(
          `UPDATE app_users
           SET full_name = $1,
               user_name = $2,
               role = $3,
               is_temp_pass = $4,
               updated_at = NOW()
           WHERE id = $5
           RETURNING id, user_name, full_name, role, is_temp_pass, created_at, updated_at`,
          [fullName, userName, role, isTempPass, userId]
        )

    if ((updated.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 })
    }

    const row = updated.rows[0]
    return NextResponse.json({
      status: "success",
      message: "تم تحديث الحساب بنجاح",
      data: {
        id: row.id as number,
        userName: row.user_name as string,
        fullName: row.full_name as string,
        role: row.role as string,
        isTempPass: row.is_temp_pass as boolean,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      },
    })
  } catch (error) {
    const pgError = error as { code?: string }
    if (pgError.code === "23505") {
      return NextResponse.json({ message: "اسم المستخدم مستخدم بالفعل" }, { status: 409 })
    }
    return NextResponse.json({ message: "فشل تحديث الحساب", error: String(error) }, { status: 500 })
  }
}
