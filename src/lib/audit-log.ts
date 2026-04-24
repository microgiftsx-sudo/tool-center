import { getDbPool } from "@/lib/db"
import type { SessionUser } from "@/lib/auth-server"

type AuditPayload = Record<string, unknown> | null

export async function writeAuditLog(params: {
  actor: SessionUser | null
  action: string
  targetType?: string
  targetId?: string
  details?: AuditPayload
}) {
  const { actor, action, targetType, targetId, details } = params
  if (!actor) return

  try {
    const pool = getDbPool()
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, actor_user_name, actor_role, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        actor.id,
        actor.userName,
        actor.role,
        action,
        targetType ?? null,
        targetId ?? null,
        JSON.stringify(details ?? {}),
      ]
    )
  } catch {
    // Audit logging must not break the main business action.
  }
}
