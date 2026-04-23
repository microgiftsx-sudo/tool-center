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
import { useAuthStore } from "@/store/auth/authStore";
import type { RegisterUserData, RegisterResponse } from "@/store/auth/authTypes";

const registerSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل"),
  userName: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  role: z.string().min(1, "الدور مطلوب"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type RegisterFormData = RegisterUserData & { confirmPassword: string };

const defaultForm: RegisterFormData = {
  fullName: "",
  userName: "",
  role: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [formData, setFormData] = useState<RegisterFormData>(defaultForm);
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

  const handleChange = (field: keyof RegisterFormData) => (
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
        data: {
          fullName: validation.data.fullName,
          userName: validation.data.userName,
          role: validation.data.role,
          password: validation.data.password,
        },
        onSuccess: (response) => {
          const responseData = (response as { data?: RegisterResponse })?.data;
          if (!responseData?.access_token || !responseData.user) {
            toast.error("تم إنشاء الحساب لكن تعذر تسجيل الدخول التلقائي");
            router.push("/login");
            return;
          }
          setAuth(responseData.user, responseData.access_token);
          toast.success("تم إنشاء الحساب وتسجيل الدخول بنجاح");
          setFormData(defaultForm);
          setErrors({});
          router.push("/");
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

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="أدخل كلمة مرور قوية"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="أعد إدخال كلمة المرور"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
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
