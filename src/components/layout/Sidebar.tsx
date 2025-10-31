
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
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUser } from "@/firebase";

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
  // The useUser hook now provides the user object from Firebase Auth
  const { user } = useUser();
  // We'll hardcode the role for now, but this could come from a custom claim
  const userRole = "Admin"; 

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M6 8.25C8.5 6.25 12.5 5.25 15.5 6.75C18.5 8.25 20.5 12 18 15.5C15.5 19 11.5 20 8.5 18.5C5.5 17 3.5 13.25 6 9.75" />
            </svg>
          </div>
          <span className="font-semibold text-lg">SwiftRoute</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.role && item.role !== userRole) {
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
