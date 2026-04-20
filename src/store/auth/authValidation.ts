import { z } from "zod"

// Login form validation schema
export const loginSchema = z.object({
  userName: z
    .string()
    .min(1, "اسم المستخدم مطلوب"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة")
})

// User profile validation schema
export const userProfileSchema = z.object({
  name: z
    .string()
    .min(1, "الاسم مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("البريد الإلكتروني غير صحيح"),
  avatar: z.string().optional(),
  role: z.string().optional(),
})

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z
    .string()
    .min(1, "تأكيد كلمة المرور مطلوب")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"]
})

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>
export type UserProfileFormData = z.infer<typeof userProfileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>