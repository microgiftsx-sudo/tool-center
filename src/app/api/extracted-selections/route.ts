import { NextResponse } from "next/server"
import { ensureExtractedSelectionsTable, getDbPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RECORD_ID = "excel-extractor-selected"

type SelectionPayload = {
  fileName: string
  headers: string[]
  rows: Record<string, unknown>[]
  savedAt: string
}

function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL)
}

export async function GET() {
  if (!databaseConfigured()) {
    return NextResponse.json(
      { message: "DATABASE_URL is missing", data: null },
      { status: 500 }
    )
  }

  try {
    await ensureExtractedSelectionsTable()
    const pool = getDbPool()
    const result = await pool.query(
      "SELECT file_name, headers, rows, saved_at FROM extracted_selections WHERE id = $1 LIMIT 1",
      [RECORD_ID]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ data: null })
    }

    const row = result.rows[0]
    return NextResponse.json({
      data: {
        fileName: row.file_name as string,
        headers: (row.headers as string[]) ?? [],
        rows: (row.rows as Record<string, unknown>[]) ?? [],
        savedAt: new Date(row.saved_at as string).toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load saved selection", error: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<SelectionPayload>
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : ""
    const headers = Array.isArray(body.headers) ? body.headers.filter((h): h is string => typeof h === "string") : []
    const rows = Array.isArray(body.rows) ? body.rows : []
    const savedAt = typeof body.savedAt === "string" ? body.savedAt : new Date().toISOString()

    if (!fileName || headers.length === 0 || rows.length === 0) {
      return NextResponse.json({ message: "Invalid selection payload" }, { status: 400 })
    }

    if (!databaseConfigured()) {
      return NextResponse.json({ message: "DATABASE_URL is missing" }, { status: 500 })
    }

    await ensureExtractedSelectionsTable()
    const pool = getDbPool()
    await pool.query(
      `INSERT INTO extracted_selections (id, file_name, headers, rows, saved_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::timestamptz, NOW())
       ON CONFLICT (id) DO UPDATE SET
         file_name = EXCLUDED.file_name,
         headers = EXCLUDED.headers,
         rows = EXCLUDED.rows,
         saved_at = EXCLUDED.saved_at,
         updated_at = NOW()`,
      [RECORD_ID, fileName, JSON.stringify(headers), JSON.stringify(rows), savedAt]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to save selection", error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    if (!databaseConfigured()) {
      return NextResponse.json({ message: "DATABASE_URL is missing" }, { status: 500 })
    }

    await ensureExtractedSelectionsTable()
    const pool = getDbPool()
    await pool.query("DELETE FROM extracted_selections WHERE id = $1", [RECORD_ID])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to clear saved selection", error: String(error) },
      { status: 500 }
    )
  }
}
