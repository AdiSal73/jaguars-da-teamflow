import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Shield, Calendar, ClipboardList, Activity, LogOut, Settings, TrendingUp, MessageSquare, UserCog, ChevronDown, Menu, Clock, Bell, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import NotificationCenter from "./components/notifications/NotificationCenter";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
  {
    title: "Club Management",
    url: createPageUrl("ClubManagement"),
    icon: Settings,
    submenu: [
      { title: "Unassigned Records", url: createPageUrl("UnassignedRecords") },
      { title: "Assessments", url: createPageUrl("Assessments") },
      { title: "Evaluations", url: createPageUrl("Evaluations") },
      { title: "User Management", url: createPageUrl("UserManagement") },
    ]
  },
  {
    title: "Coach Management",
    url: createPageUrl("CoachManagement"),
    icon: UserCog,
  },
  {
    title: "Teams",
    url: createPageUrl("Teams"),
    icon: Shield,
  },
  {
    title: "Players",
    url: createPageUrl("Players"),
    icon: Users,
  },
  {
    title: "Training Plans",
    url: createPageUrl("TrainingPlans"),
    icon: TrendingUp,
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageSquare,
  },
  {
    title: "Availability",
    url: createPageUrl("Availability"),
    icon: Clock,
  },
  {
    title: "Book Session",
    url: createPageUrl("BookSession"),
    icon: Calendar,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar className="border-r border-slate-200" collapsible="icon">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h2 className="font-bold text-slate-900 text-lg">Soccer Hub</h2>
                <p className="text-xs text-slate-500">Elite Training Center</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 group-data-[collapsible=icon]:hidden">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    item.submenu ? (
                      <Collapsible key={item.title} className="group/collapsible">
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-xl mb-1">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                              <ChevronDown className="ml-auto w-4 h-4 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild>
                                  <Link to={item.url} className={location.pathname === item.url ? 'bg-emerald-50 text-emerald-700' : ''}>
                                    <span className="font-medium">Overview</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
                                    <Link to={subItem.url} className={location.pathname === subItem.url ? 'bg-emerald-50 text-emerald-700' : ''}>
                                      <span className="font-medium">{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url ? 'bg-emerald-50 text-emerald-700 shadow-sm' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">Sign Out</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-slate-900 md:hidden">Soccer Hub</h1>
              </div>
              <NotificationCenter />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}