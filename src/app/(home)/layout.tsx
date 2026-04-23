import TopNav from "@/components/layouts/top-nav";
import { cookies } from "next/headers";
import { getDbPool } from "@/lib/db";
import { getSessionUserFromToken } from "@/lib/auth-server";

async function resolveMaintenanceState() {
  const envEnabled = process.env.MAINTENANCE_MODE === "true";
  if (envEnabled) return { enabled: true, source: "env" as const };

  try {
    const pool = getDbPool();
    const result = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'maintenance_mode' LIMIT 1"
    );
    const enabled = (result.rowCount ?? 0) > 0 && String(result.rows[0].value) === "true";
    return { enabled, source: "db" as const };
  } catch {
    return { enabled: false, source: "db" as const };
  }
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value ?? "";
  const [maintenance, sessionUser] = await Promise.all([
    resolveMaintenanceState(),
    getSessionUserFromToken(accessToken),
  ]);
  const isAdmin = sessionUser?.role === "admin";
  const showMaintenance = maintenance.enabled && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 px-6 md:px-10 py-8 w-full">
        {showMaintenance ? (
          <div className="max-w-2xl mx-auto py-10">
            <div className="border rounded-2xl p-8 text-center space-y-3 bg-muted/20">
              <h1 className="text-2xl font-bold">الموقع في وضع الصيانة</h1>
              <p className="text-muted-foreground">
                نعمل حاليًا على تحسين المنصة. يرجى المحاولة لاحقًا.
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        مركز الأدوات — جميع العمليات تتم في المتصفح، لا يُرفع أي ملف إلى الخادم
      </footer>
    </div>
  );
}
