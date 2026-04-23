import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, message: "DATABASE_URL is missing" },
        { status: 200 }
      )
    }

    const pool = getDbPool()
    await pool.query("SELECT 1")

    return NextResponse.json({ ok: true, message: "Database connection is healthy" })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Database connection failed", error: String(error) },
      { status: 200 }
    )
  }
}
