import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  return NextResponse.json(
    { message: "إنشاء الحساب المباشر معطل. استخدم طلب حساب من صفحة التسجيل أو لوحة الأدمن." },
    { status: 403 }
  )
}
