"use client"

import Link from "next/link"
import { FileSpreadsheet, ScanSearch, ArrowLeft, Download, Layers, ArrowLeftRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const tools = [
  {
    title: "استخراج بيانات Excel",
    description: "ارفع ملف Excel واستخرج صفوفاً محددة عبر تصفية الأعمدة. حدّد الصفوف وصدّرها كملف Excel أو انسخها أو اطبعها.",
    icon: FileSpreadsheet,
    href: "/excel-extractor",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800",
    border: "hover:border-emerald-300 dark:hover:border-emerald-700",
    shadow: "hover:shadow-emerald-100 dark:hover:shadow-emerald-900/30",
  },
  {
    title: "كشف التكرار",
    description: "اكتشف القيم المكررة في ملفات Excel أو في نص تلصقه مباشرة. يعرض التكرارات مع عدد مرات الظهور فوراً.",
    icon: ScanSearch,
    href: "/duplicate-detector",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30 ring-1 ring-violet-200 dark:ring-violet-800",
    border: "hover:border-violet-300 dark:hover:border-violet-700",
    shadow: "hover:shadow-violet-100 dark:hover:shadow-violet-900/30",
  },
  {
    title: "دمج ملفات Excel",
    description: "ارفع ملفين أو أكثر من Excel وادمجهم في ورقة واحدة مع تحديد الأعمدة المطلوبة وخيار إضافة عمود المصدر.",
    icon: Layers,
    href: "/excel-merger",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/30 ring-1 ring-sky-200 dark:ring-sky-800",
    border: "hover:border-sky-300 dark:hover:border-sky-700",
    shadow: "hover:shadow-sky-100 dark:hover:shadow-sky-900/30",
  },
  {
    title: "مقارنة ملفين Excel",
    description: "قارن بين ملفين وأظهر الصفوف المضافة والمحذوفة والمعدّلة بألوان مختلفة بناءً على عمود مفتاح تختاره.",
    icon: ArrowLeftRight,
    href: "/excel-compare",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-800",
    border: "hover:border-orange-300 dark:hover:border-orange-700",
    shadow: "hover:shadow-orange-100 dark:hover:shadow-orange-900/30",
  },
]

export default function PortalPage() {
  return (
    <div className="flex flex-col items-center gap-10 py-10">
      <a
        href="/sample-employees.xlsx"
        download
        className="flex items-center gap-2 text-sm text-primary/80 hover:text-primary border border-primary/20 rounded-lg px-4 py-2.5 transition-all hover:bg-primary/5 hover:border-primary/40"
      >
        <Download className="w-4 h-4 shrink-0" />
        تحميل ملف Excel تجريبي (10 موظفين)
      </a>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Card
              key={tool.href}
              className={`group hover:shadow-xl transition-all duration-200 border-2 ${tool.border} ${tool.shadow}`}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${tool.bg}`}>
                  <Icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full gap-2 shadow-sm shadow-primary/20">
                  <Link href={tool.href}>
                    فتح الأداة
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
