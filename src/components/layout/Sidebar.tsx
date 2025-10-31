
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
              <path d="M13.4 2.6L10.6 2.6C8.4 2.6 7.5 4.3 8.1 6.3L10.3 12.8C10.5 13.5 11.2 14 11.9 14H12.1C12.8 14 13.5 13.5 13.7 12.8L15.9 6.3C16.5 4.3 15.6 2.6 13.4 2.6" />
              <path d="M10.3 12.8L8.1 6.3C7.5 4.3 6.6 2.6 4.4 2.6L1.6 2.6" />
              <path d="M13.7 12.8L15.9 6.3C16.5 4.3 17.4 2.6 19.6 2.6L22.4 2.6" />
              <path d="M12 14L10.7 18.2C10.4 19.4 9.4 20.3 8.2 20.3L6.3 20.3C4.8 20.3 4 21.6 4.7 22.9L5.3 23.9" />
              <path d="M12 14L13.3 18.2C13.6 19.4 14.6 20.3 15.8 20.3L17.7 20.3C19.2 20.3 20 21.6 19.3 22.9L18.7 23.9" />
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
