import React from "react";
import { LayoutDashboard, PenTool, Users, Mail, Settings, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PenTool, label: "Content Studio", path: "/content" },
  { icon: Users, label: "Leads CRM", path: "/leads" },
  { icon: Mail, label: "Campaigns", path: "/campaigns" },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar shadow-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-lg ring-2 ring-primary/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-tight tracking-tight text-foreground">Talnora</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Growth Engine</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu className="gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "flex items-center gap-3 px-4 py-6 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-elegant hover:bg-primary/90" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Link to={item.path}>
                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-glow" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6 border-t border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}