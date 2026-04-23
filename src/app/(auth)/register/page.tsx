"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const accountRequestSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  requestedRole: z.string().min(1, "الدور المطلوب مطلوب"),
  notes: z.string().max(500, "الملاحظات طويلة جدًا").optional(),
})

type AccountRequestFormData = z.infer<typeof accountRequestSchema>

const defaultForm: AccountRequestFormData = {
  fullName: "",
  email: "",
  requestedRole: "user",
  notes: "",
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<AccountRequestFormData>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resolveApiError(error: unknown): { message: string; field?: string } {
    if (typeof error === "object" && error !== null) {
      const err = error as { response?: { data?: { message?: string; field?: string } } }
      const message = err.response?.data?.message
      const field = err.response?.data?.field
      if (message) return { message, field }
    }
    return { message: "فشل إرسال الطلب، تحقق من البيانات ثم حاول مرة أخرى" }
  }

  const handleChange = (field: keyof AccountRequestFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = accountRequestSchema.safeParse(formData)

    if (!validation.success) {
      const nextErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "")
        if (field) nextErrors[field] = issue.message
      })
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/account-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { message?: string; field?: string }
        throw { response: { data: payload } }
      }
      toast.success("تم إرسال طلب الحساب بنجاح، سيتم مراجعته من المطورين")
      setFormData(defaultForm)
      setErrors({})
    } catch (error) {
      const resolved = resolveApiError(error)
      if (resolved.field) {
        setErrors((prev) => ({ ...prev, [resolved.field as string]: resolved.message }))
      }
      toast.error(resolved.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">طلب حساب</CardTitle>
          <CardDescription>أنشئ طلب حساب، وسيقوم فريق التطوير بمراجعته</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                placeholder="أدخل الاسم الكامل"
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && <p className="text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                placeholder="name@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedRole">الدور المطلوب</Label>
              <Select
                value={formData.requestedRole}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, requestedRole: value }))
                  if (errors.requestedRole) setErrors((prev) => ({ ...prev, requestedRole: "" }))
                }}
              >
                <SelectTrigger id="requestedRole" className={errors.requestedRole ? "border-red-500" : ""}>
                  <SelectValue placeholder="اختر الدور المطلوب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.requestedRole && <p className="text-sm text-red-600 dark:text-red-400">{errors.requestedRole}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">تفاصيل إضافية (اختياري)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="سبب الطلب أو الفريق/القسم..."
                className={errors.notes ? "border-red-500" : ""}
              />
              {errors.notes && <p className="text-sm text-red-600 dark:text-red-400">{errors.notes}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              إرسال الطلب
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-4">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
