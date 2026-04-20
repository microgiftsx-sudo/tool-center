"use client"

import { ScanSearch } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExcelTab } from "@/components/features/duplicate-detector/excel-tab"
import { TextTab } from "@/components/features/duplicate-detector/text-tab"

export default function DuplicateDetectorPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
          <ScanSearch className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">كشف التكرار</h1>
          <p className="text-sm text-muted-foreground">اكتشف القيم المكررة في ملفات Excel أو نص مدخل</p>
        </div>
      </div>

      <Tabs defaultValue="excel">
        <TabsList className="w-full">
          <TabsTrigger value="excel" className="flex-1">ملف Excel</TabsTrigger>
          <TabsTrigger value="text" className="flex-1">نص مباشر</TabsTrigger>
        </TabsList>
        <TabsContent value="excel" className="mt-5">
          <ExcelTab />
        </TabsContent>
        <TabsContent value="text" className="mt-5">
          <TextTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
