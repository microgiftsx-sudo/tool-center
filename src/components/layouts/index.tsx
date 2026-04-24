 "use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { DynamicBreadcrumb } from "@/components/layouts/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth/authStore";
import apiClient from "@/lib/axiosClients";
import { toast } from "sonner";

export default function Layouts({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // ignore API logout errors, always clear local session
    }
    clearAuth();
    toast.success("تم تسجيل الخروج");
    router.push("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="!h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 px-3 sm:px-4 border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="min-w-0 max-w-[42vw] sm:max-w-none">
              <DynamicBreadcrumb />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">تسجيل خروج</span>
          </Button>
        </header>
        <div className="p-3 sm:p-6 lg:p-10 pt-3 sm:pt-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
