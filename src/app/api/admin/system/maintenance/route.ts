import { NextResponse } from "next/server"
import { getDbPool } from "@/lib/db"
import { getSessionUserFromRequest } from "@/lib/auth-server"
import { hasPermission } from "@/lib/permissions"
import { writeAuditLog } from "@/lib/audit-log"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function envMaintenanceEnabled() {
  return process.env.MAINTENANCE_MODE === "true"
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request)
    if (!hasPermission(user, "maintenance:read")) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 403 })
    }

    const pool = getDbPool()
    const result = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'maintenance_mode' LIMIT 1"
    )
    const dbEnabled = (result.rowCount ?? 0) > 0 && String(result.rows[0].value) === "true"
    const envEnabled = envMaintenanceEnabled()

    return NextResponse.json({
      status: "success",
      data: {
        enabled: envEnabled || dbEnabled,
        source: envEnabled ? "env" : "db",
        envOverride: envEnabled,
        dbEnabled,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: "تعذر قراءة حالة الصيانة", error: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request)
    if (!hasPermission(user, "maintenance:manage")) {
      return NextResponse.json({ message: "غير مصرح" }, { status: 403 })
    }

    const body = (await request.json()) as { enabled?: boolean }
    const enabled = Boolean(body.enabled)

    const pool = getDbPool()
    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('maintenance_mode', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()`,
      [enabled ? "true" : "false"]
    )

    await writeAuditLog({
      actor: user,
      action: enabled ? "maintenance.enable" : "maintenance.disable",
      targetType: "app_setting",
      targetId: "maintenance_mode",
      details: { enabled },
    })

    return NextResponse.json({
      status: "success",
      message: enabled ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة",
      data: { enabled },
    })
  } catch (error) {
    return NextResponse.json(
      { message: "تعذر تحديث وضع الصيانة", error: String(error) },
      { status: 500 }
    )
  }
}
