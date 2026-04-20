import TopNav from "@/components/layouts/top-nav";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 px-6 md:px-10 py-8 w-full">
        {children}
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        مركز الأدوات — جميع العمليات تتم في المتصفح، لا يُرفع أي ملف إلى الخادم
      </footer>
    </div>
  );
}
