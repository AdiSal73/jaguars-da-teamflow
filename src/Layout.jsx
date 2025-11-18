import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Shield, Calendar, Activity, LogOut, Settings, TrendingUp, MessageSquare, UserCog, ChevronDown, Clock, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
import NotificationCenter from "./components/notifications/NotificationCenter";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => base44.entities.Coach.list(),
    enabled: !!user
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
    enabled: !!user && user.role === 'user'
  });

  const getUserRole = () => {
    if (!user) return null;
    if (user.role === 'admin') return 'admin';
    const isCoach = coaches.find(c => c.email === user.email);
    if (isCoach) return 'coach';
    return 'user';
  };

  const userRole = getUserRole();

  // Redirect user role to their player profile
  React.useEffect(() => {
    if (userRole === 'user' && players.length > 0 && location.pathname === '/') {
      const currentPlayer = players.find(p => p.email === user.email);
      if (currentPlayer) {
        navigate(`/player-profile?id=${currentPlayer.id}`);
      }
    }
  }, [userRole, players, location.pathname, user, navigate]);

  const allNavigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, roles: ["admin"] },
    { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3, roles: ["admin"] },
    {
      title: "Club Management",
      url: createPageUrl("ClubManagement"),
      icon: Settings,
      roles: ["admin"],
      submenu: [
        { title: "Unassigned Records", url: createPageUrl("UnassignedRecords") },
        { title: "Assessments", url: createPageUrl("Assessments") },
        { title: "Evaluations", url: createPageUrl("Evaluations") },
        { title: "User Management", url: createPageUrl("UserManagement") },
      ]
    },
    { title: "Coach Management", url: createPageUrl("CoachManagement"), icon: UserCog, roles: ["admin"] },
    { title: "Teams", url: createPageUrl("Teams"), icon: Shield, roles: ["admin", "coach"] },
    { title: "Players", url: createPageUrl("Players"), icon: Users, roles: ["admin"] },
    { title: "Training Plans", url: createPageUrl("TrainingPlans"), icon: TrendingUp, roles: ["admin", "coach"] },
    { title: "Messages", url: createPageUrl("Messages"), icon: MessageSquare, roles: ["admin", "coach", "user"] },
    { title: "Availability", url: createPageUrl("Availability"), icon: Clock, roles: ["admin", "coach"] },
    { title: "Book Session", url: createPageUrl("BookSession"), icon: Calendar, roles: ["admin", "coach", "user"] },
  ];

  const navigationItems = allNavigationItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  if (!user || !userRole) return <div>Loading...</div>;

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