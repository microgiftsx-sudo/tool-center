import { getDbPool } from "@/lib/db"

export type SessionUser = {
  id: number
  userName: string
  fullName: string
  role: string
  isTempPass: boolean
}

function extractBearerToken(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth || !auth.startsWith("Bearer ")) return null
  return auth.slice("Bearer ".length).trim()
}

export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  const token = extractBearerToken(request)
  if (!token) return null
  return getSessionUserFromToken(token)
}

export async function getSessionUserFromToken(token: string): Promise<SessionUser | null> {
  if (!token) return null

  const pool = getDbPool()
  const result = await pool.query(
    `SELECT u.id, u.user_name, u.full_name, u.role, u.is_temp_pass
     FROM auth_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [token]
  )

  if (result.rowCount === 0) return null
  const row = result.rows[0]
  return {
    id: row.id as number,
    userName: row.user_name as string,
    fullName: row.full_name as string,
    role: row.role as string,
    isTempPass: row.is_temp_pass as boolean,
  }
}
