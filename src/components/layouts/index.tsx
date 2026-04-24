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
      <SidebarInset className="!h-screen overflow-y-scroll">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل خروج</span>
          </Button>
        </header>
        <div className="  p-10  pt-4 ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
