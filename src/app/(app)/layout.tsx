"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-row bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 sm:px-6 sm:py-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
