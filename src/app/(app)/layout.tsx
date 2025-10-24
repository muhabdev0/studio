
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { AppSidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DataCacheProvider } from "@/lib/data-cache";

function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DataCacheProvider>
        <div className="flex min-h-screen w-full flex-row bg-muted/40">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 p-4 sm:px-6 sm:py-6">
              <Suspense fallback={<Loading />}>
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </DataCacheProvider>
    </SidebarProvider>
  );
}
