"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth/authStore";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/store/auth/authValidation";
import type { User, ChangePasswordData } from "@/store/auth/authTypes";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState<LoginFormData>({
    userName: "",
    password: ""
  });
  const [changePasswordData, setChangePasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");

  const { login, changePassword, loading } = useAuth();

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handlePasswordChange = (field: keyof ChangePasswordData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setChangePasswordData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const formErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(formErrors);
      return;
    }

    try {
      await login({
        data: formData,
        onSuccess: (response: unknown) => {
          const responseData = (response as Record<string, unknown>).data || response;
          const { access_token, user } = responseData as Record<string, any>;
          
          // Check if user has temporary password
          if (user.isTempPass) {
            setLoggedInUser(user);
            setAccessToken(access_token);
            setChangePasswordData({
              currentPassword: formData.password,
              newPassword: ""
            });
            setShowChangePassword(true);
            setErrors({});
          } else {
            // Normal login - redirect to home
            setAuth(user, access_token);
            router.push("/");
          }
        },
        onError: (error: unknown) => {
          console.error("Login error:", error);
          toast.error("فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.");
        }
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!changePasswordData.newPassword.trim()) {
      setErrors({
        newPassword: "كلمة المرور الجديدة مطلوبة"
      });
      return;
    }

    if (changePasswordData.newPassword.length < 6) {
      setErrors({
        newPassword: "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
      });
      return;
    }

    // First set auth temporarily for the changePassword API call
    if (loggedInUser && accessToken) {
      setAuth(loggedInUser, accessToken);
    }

    try {
      await changePassword({
        data: changePasswordData,
        onSuccess: () => {
          // Password changed successfully, now login with new auth state
          toast.success("تم تغيير كلمة المرور بنجاح!");
          if (loggedInUser && accessToken) {
            setAuth(loggedInUser, accessToken);
            router.push("/");
          }
        },
        onError: (error: unknown) => {
          console.error("Change password error:", error);
          toast.error("فشل في تغيير كلمة المرور. يرجى المحاولة مرة أخرى.");
        }
      });
    } catch (error) {
      console.error("Change password error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      
      <Card className="w-full max-w-md">
        {!showChangePassword ? (
          // Login Form
          <>
          
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">
                تسجيل الدخول
              </CardTitle>
              <CardDescription>
                أدخل بياناتك للوصول إلى نظام العلاوات والترفيعات
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="userName">اسم المستخدم</Label>
                  <Input
                    id="userName"
                    type="text"
                    value={formData.userName}
                    onChange={handleInputChange("userName")}
                    placeholder="أدخل اسم المستخدم"
                    className={errors.userName ? "border-red-500" : ""}
                  />
                  {errors.userName && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.userName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    placeholder="أدخل كلمة المرور"
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading.login}
                >
                  {loading.login && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  تسجيل الدخول
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          // Change Password Form
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-2xl font-bold">
                تغيير كلمة المرور المؤقتة
              </CardTitle>
              <CardDescription>
                مرحباً {loggedInUser?.fullName}، يجب تغيير كلمة المرور المؤقتة قبل المتابعة
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    كلمة المرور الحالية مؤقتة ويجب تغييرها لأسباب أمنية
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={changePasswordData.currentPassword}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    كلمة المرور المؤقتة التي استخدمتها لتسجيل الدخول
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={changePasswordData.newPassword}
                    onChange={handlePasswordChange("newPassword")}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className={errors.newPassword ? "border-red-500" : ""}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.newPassword}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    يجب أن تكون كلمة المرور 6 أحرف على الأقل
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading.changePassword}
                >
                  {loading.changePassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  تغيير كلمة المرور والمتابعة
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}