"use client"

import React from "react";
import { ThemeProvider } from "@/context/theme-context";
import { SidebarProvider } from "@/context/sidebar-context"; 

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
    </ThemeProvider>
  );
}