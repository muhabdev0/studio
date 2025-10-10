"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bus,
  LayoutDashboard,
  Users,
  Route,
  Ticket,
  CreditCard,
  Building,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: Ticket },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/buses", label: "Buses", icon: Bus },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/finance", label: "Finance", icon: CreditCard, role: "Admin" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">SwiftRoute</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.role && item.role !== user?.role) {
              return null;
            }
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{
                    children: item.label,
                    side: "right",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
