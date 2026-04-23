import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function extractToken(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth) return null
  if (!auth.startsWith("Bearer ")) return null
  return auth.replace("Bearer ", "").trim()
}

export async function POST(request: Request) {
  try {
    const token = extractToken(request)
    if (!token) return NextResponse.json({ ok: true })

    const pool = getDbPool()
    await pool.query("DELETE FROM auth_sessions WHERE token = $1", [token])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: "فشل تسجيل الخروج", error: String(error) },
      { status: 500 }
    )
  }
}
