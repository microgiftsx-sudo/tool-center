"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, Loader2, CheckCircle2, XCircle, UserPlus, Wrench, Pencil, Save } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { tokenManager } from "@/lib/tokenManager"
import { Textarea } from "@/components/ui/textarea"

type AccountRequest = {
  id: number
  fullName: string
  email: string
  requestedRole: string
  notes: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

type AppUser = {
  id: number
  userName: string
  fullName: string
  role: string
  isTempPass: boolean
  createdAt: string
}

type UserEditForm = {
  fullName: string
  userName: string
  role: string
  isTempPass: boolean
  password: string
}

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<AccountRequest[]>([])
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<"requests" | "create" | "users" | "maintenance">("requests")
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceSource, setMaintenanceSource] = useState<"db" | "env">("db")
  const [usersLoading, setUsersLoading] = useState(true)
  const [users, setUsers] = useState<AppUser[]>([])
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [savingUserId, setSavingUserId] = useState<number | null>(null)
  const [userEditForm, setUserEditForm] = useState<UserEditForm>({
    fullName: "",
    userName: "",
    role: "user",
    isTempPass: false,
    password: "",
  })
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    role: "user",
    password: "",
  })

  async function authedFetch(url: string, init?: RequestInit) {
    const token = tokenManager.getToken()
    const headers = new Headers(init?.headers)
    headers.set("Content-Type", "application/json")
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const res = await fetch(url, { ...init, headers })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      throw { response: { data: json } }
    }
    return json
  }

  async function loadRequests() {
    setLoading(true)
    try {
      const res = await authedFetch("/api/account-requests")
      const data = (res as { data?: AccountRequest[] })?.data ?? []
      setRequests(data)
    } catch {
      toast.error("تعذر تحميل طلبات الحساب")
    } finally {
      setLoading(false)
    }
  }

  async function loadMaintenance() {
    setMaintenanceLoading(true)
    try {
      const res = await authedFetch("/api/admin/system/maintenance")
      const data = (res as { data?: { enabled?: boolean; source?: "db" | "env" } }).data
      setMaintenanceEnabled(Boolean(data?.enabled))
      setMaintenanceSource((data?.source ?? "db") as "db" | "env")
    } catch {
      toast.error("تعذر قراءة حالة الصيانة")
    } finally {
      setMaintenanceLoading(false)
    }
  }

  async function loadUsers() {
    setUsersLoading(true)
    try {
      const res = await authedFetch("/api/auth/users")
      const data = (res as { data?: { items?: AppUser[] } }).data?.items ?? []
      setUsers(data)
    } catch {
      toast.error("تعذر تحميل الحسابات الحالية")
    } finally {
      setUsersLoading(false)
    }
  }

  async function toggleMaintenance(nextState: boolean) {
    try {
      await authedFetch("/api/admin/system/maintenance", {
        method: "PUT",
        body: JSON.stringify({ enabled: nextState }),
      })
      setMaintenanceEnabled(nextState)
      toast.success(nextState ? "تم تفعيل وضع الصيانة" : "تم إيقاف وضع الصيانة")
      await loadMaintenance()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "فشل تحديث وضع الصيانة")
    }
  }

  useEffect(() => {
    loadRequests()
    loadMaintenance()
    loadUsers()
  }, [])

  async function approveRequest(id: number) {
    setProcessingId(id)
    try {
      const res = await authedFetch(`/api/account-requests/${id}/approve`, { method: "POST" })
      const payload = (res as { data?: { email?: string; tempPassword?: string } })?.data
      toast.success(`تمت الموافقة. البريد: ${payload?.email ?? ""} - كلمة مرور مؤقتة: ${payload?.tempPassword ?? ""}`)
      await loadRequests()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "فشلت عملية الموافقة")
    } finally {
      setProcessingId(null)
    }
  }

  async function rejectRequest(id: number) {
    setProcessingId(id)
    try {
      await authedFetch(`/api/account-requests/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "rejected by admin" }),
      })
      toast.success("تم رفض الطلب")
      await loadRequests()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "فشلت عملية الرفض")
    } finally {
      setProcessingId(null)
    }
  }

  async function createEmailAccount(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await authedFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      })
      const payload = (res as { data?: { email?: string; password?: string } })?.data
      toast.success(`تم إنشاء الحساب: ${payload?.email ?? ""} ${payload?.password ? `- كلمة المرور: ${payload.password}` : ""}`)
      setCreateForm({ fullName: "", email: "", role: "user", password: "" })
      await loadRequests()
      await loadUsers()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "فشل إنشاء الحساب")
    }
  }

  function startEditUser(account: AppUser) {
    setEditingUserId(account.id)
    setUserEditForm({
      fullName: account.fullName,
      userName: account.userName,
      role: account.role,
      isTempPass: account.isTempPass,
      password: "",
    })
  }

  function cancelEditUser() {
    setEditingUserId(null)
    setSavingUserId(null)
  }

  async function saveUserEdit(userId: number) {
    setSavingUserId(userId)
    try {
      const payload = userEditForm.password
        ? userEditForm
        : {
            fullName: userEditForm.fullName,
            userName: userEditForm.userName,
            role: userEditForm.role,
            isTempPass: userEditForm.isTempPass,
          }
      await authedFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      toast.success("تم تحديث تفاصيل الحساب")
      setEditingUserId(null)
      await loadUsers()
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "فشل تحديث الحساب")
    } finally {
      setSavingUserId(null)
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>غير مصرح</CardTitle>
            <CardDescription>هذه الصفحة مخصصة للمشرف فقط.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const pending = requests.filter((r) => r.status === "pending")

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <aside className="border rounded-2xl p-3 h-fit sticky top-20 bg-card">
          <div className="flex items-center gap-2 mb-3 px-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">أقسام الأدمن</p>
          </div>
          <div className="space-y-1">
            <Button variant={activeSection === "requests" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveSection("requests")}>
              طلبات الحساب
            </Button>
            <Button variant={activeSection === "create" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveSection("create")}>
              تسجيل الحسابات
            </Button>
            <Button variant={activeSection === "users" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveSection("users")}>
              الحسابات الحالية
            </Button>
            <Button variant={activeSection === "maintenance" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveSection("maintenance")}>
              وضع الصيانة
            </Button>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">لوحة بسيطة وقابلة للتوسعة لإدارة المنصة</p>
            </div>
          </div>

          {activeSection === "create" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">تسجيل الحسابات</CardTitle>
                <CardDescription>أنشئ حسابًا يدويًا من لوحة المشرف</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createEmailAccount} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الاسم الكامل</Label>
                    <Input value={createForm.fullName} onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الدور</Label>
                    <Input value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>كلمة المرور (اختياري)</Label>
                    <Input value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} placeholder="اتركها فارغة للتوليد التلقائي" />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      إنشاء الحساب
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === "requests" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">طلبات الحساب من المطورين ({pending.length})</CardTitle>
                <CardDescription>راجع الطلبات ثم وافق أو ارفض</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري تحميل الطلبات...
                  </div>
                ) : pending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد طلبات معلقة حاليًا.</p>
                ) : (
                  pending.map((req) => (
                    <div key={req.id} className="border rounded-xl p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{req.fullName}</p>
                        <span className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString("ar-SA")}</span>
                      </div>
                      <p className="text-sm"><strong>البريد:</strong> {req.email}</p>
                      <p className="text-sm"><strong>الدور المطلوب:</strong> {req.requestedRole}</p>
                      {req.notes && <p className="text-sm"><strong>ملاحظات:</strong> {req.notes}</p>}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => approveRequest(req.id)}
                          disabled={processingId === req.id}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          موافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5"
                          onClick={() => rejectRequest(req.id)}
                          disabled={processingId === req.id}
                        >
                          <XCircle className="w-4 h-4" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "maintenance" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  وضع الصيانة
                </CardTitle>
                <CardDescription>
                  تحكم بحالة المنصة للحسابات غير الأدمن. يمكنك أيضًا فرض الوضع من `.env` عبر `MAINTENANCE_MODE=true`.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {maintenanceLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري قراءة الحالة...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <p className="font-medium">{maintenanceEnabled ? "الصيانة مفعلة" : "الصيانة متوقفة"}</p>
                        <p className="text-xs text-muted-foreground">
                          مصدر الحالة الحالي: {maintenanceSource === "env" ? "ENV (إجباري)" : "قاعدة البيانات"}
                        </p>
                      </div>
                      <Button
                        variant={maintenanceEnabled ? "destructive" : "default"}
                        onClick={() => toggleMaintenance(!maintenanceEnabled)}
                        disabled={maintenanceSource === "env"}
                      >
                        {maintenanceEnabled ? "إيقاف الصيانة" : "تشغيل الصيانة"}
                      </Button>
                    </div>
                    {maintenanceSource === "env" && (
                      <p className="text-xs text-amber-600">
                        وضع الصيانة مفروض من `.env`. غيّر `MAINTENANCE_MODE=false` لإرجاع التحكم للوحة الأدمن.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "users" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الحسابات الحالية ({users.length})</CardTitle>
                <CardDescription>عرض جميع الحسابات المسجلة حاليًا في المنصة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {usersLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري تحميل الحسابات...
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد حسابات مسجلة حاليًا.</p>
                ) : (
                  users.map((account) => (
                    <div key={account.id} className="border rounded-xl p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {editingUserId === account.id ? userEditForm.fullName : account.fullName}
                        </p>
                        <span className="text-xs text-muted-foreground">{new Date(account.createdAt).toLocaleString("ar-SA")}</span>
                      </div>
                      {editingUserId === account.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs">الاسم الكامل</Label>
                            <Input
                              value={userEditForm.fullName}
                              onChange={(e) => setUserEditForm((p) => ({ ...p, fullName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">اسم المستخدم</Label>
                            <Input
                              value={userEditForm.userName}
                              onChange={(e) => setUserEditForm((p) => ({ ...p, userName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">الدور</Label>
                            <Input
                              value={userEditForm.role}
                              onChange={(e) => setUserEditForm((p) => ({ ...p, role: e.target.value }))}
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm mt-6">
                            <Input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={userEditForm.isTempPass}
                              onChange={(e) => setUserEditForm((p) => ({ ...p, isTempPass: e.target.checked }))}
                            />
                            كلمة المرور مؤقتة
                          </label>
                          <div className="space-y-1">
                            <Label className="text-xs">كلمة مرور جديدة (اختياري)</Label>
                            <Input
                              type="password"
                              value={userEditForm.password}
                              onChange={(e) => setUserEditForm((p) => ({ ...p, password: e.target.value }))}
                              placeholder="اتركه فارغًا بدون تغيير"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 mt-2">
                          <p className="text-sm"><strong>اسم المستخدم:</strong> {account.userName}</p>
                          <p className="text-sm"><strong>الدور:</strong> {account.role}</p>
                          <p className="text-sm"><strong>الحالة:</strong> {account.isTempPass ? "كلمة مرور مؤقتة" : "نشط"}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        {editingUserId === account.id ? (
                          <>
                            <Button
                              size="sm"
                              className="gap-1.5"
                              onClick={() => saveUserEdit(account.id)}
                              disabled={savingUserId === account.id}
                            >
                              {savingUserId === account.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              حفظ التعديلات
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditUser}>
                              إلغاء
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startEditUser(account)}>
                            <Pencil className="w-4 h-4" />
                            تعديل التفاصيل
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
