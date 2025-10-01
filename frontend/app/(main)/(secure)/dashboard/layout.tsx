"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { BarChart3, Star, Home, TrendingUp, User } from "lucide-react";
import useIsMobile from "@/hooks/useIsMobile";

// Menu items
const menuItems = [
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: BarChart3,
  },
  {
    title: "Watchlist",
    url: "/watchlist",
    icon: Star,
  },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      variant="inset"
      className="from-background via-muted/60 to-background min-w-[240px] rounded-r-2xl border-r bg-gradient-to-b px-0 py-0 shadow-xl"
    >
      <SidebarHeader>
        <div className="border-muted/40 flex items-center gap-3 border-b px-8 py-6">
          <TrendingUp className="text-primary h-8 w-8" />
          <span className="text-primary text-2xl font-extrabold tracking-tight">
            Dashboard
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="text-muted-foreground px-8 pt-8 pb-3 text-xs font-semibold tracking-wider uppercase select-none">
          Dashboard
        </div>
        <SidebarMenu className="flex flex-col gap-3 px-2">
          {menuItems.map((item) => {
            const active = pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <Link
                  href={item.url}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex flex-row items-center",
                    "rounded-full px-5 py-2 font-bold",
                    active && "bg-primary text-background",
                    !active &&
                      "hover:bg-accent text-muted-foreground hover:text-primary",
                    "ring-muted-foreground active:ring-4",
                    "transition-all duration-300",
                    "w-full",
                  )}
                >
                  <item.icon className="mr-1.5 size-4" />
                  {item.title}
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="border-muted/40 mt-4 border-t p-8">
          <Separator className="mb-4" />
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <User className="h-4 w-4" />
            <span>Trading Dashboard</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="bg-muted flex h-screen w-full">
        <DashboardSidebar />
        <SidebarInset>
          <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center gap-2 border-b px-8 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">
              {menuItems.find((item) => item.url === pathname)?.title ||
                "Dashboard"}
            </h1>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
