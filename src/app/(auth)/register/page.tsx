"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { RegisterUserData } from "@/store/auth/authTypes";

const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
  userName: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  role: z.string().min(1, "الدور مطلوب"),
});

const defaultForm: RegisterUserData = {
  fullName: "",
  userName: "",
  role: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState<RegisterUserData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function resolveApiError(error: unknown): { message: string; field?: string } {
    if (typeof error === "object" && error !== null) {
      const err = error as { response?: { data?: { message?: string; field?: string } } }
      const message = err.response?.data?.message;
      const field = err.response?.data?.field;
      if (message) return { message, field };
    }
    return { message: "فشل إنشاء الحساب، تحقق من البيانات ثم حاول مرة أخرى" };
  }

  const handleChange = (field: keyof RegisterUserData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = registerSchema.safeParse(formData);

    if (!validation.success) {
      const nextErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "");
        if (field) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    try {
      await register({
        data: validation.data,
        onSuccess: () => {
          toast.success("تم إنشاء الحساب بنجاح");
          setFormData(defaultForm);
          setErrors({});
          router.push("/login");
        },
        onError: (error) => {
          const resolved = resolveApiError(error);
          if (resolved.field) {
            setErrors((prev) => ({ ...prev, [resolved.field as string]: resolved.message }));
          }
          toast.error(resolved.message);
        },
      });
    } catch {
      // handled via onError
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">إنشاء حساب</CardTitle>
          <CardDescription>أنشئ حسابًا جديدًا للوصول إلى مركز الأدوات</CardDescription>
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
              <Label htmlFor="userName">اسم المستخدم</Label>
              <Input
                id="userName"
                value={formData.userName}
                onChange={handleChange("userName")}
                placeholder="أدخل اسم المستخدم"
                className={errors.userName ? "border-red-500" : ""}
              />
              {errors.userName && <p className="text-sm text-red-600 dark:text-red-400">{errors.userName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={handleChange("role")}
                placeholder="مثال: admin أو user"
                className={errors.role ? "border-red-500" : ""}
              />
              {errors.role && <p className="text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading.register}>
              {loading.register && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              تسجيل الحساب
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
  );
}
