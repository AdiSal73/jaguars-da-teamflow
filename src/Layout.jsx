import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, Users, Shield, Calendar, Activity, LogOut, 
  ChevronDown, Clock, BarChart3, UserCog, MessageSquare, 
  TrendingUp, Settings, Menu, X, Bell
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from "./components/notifications/NotificationCenter";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  React.useEffect(() => {
    if (isError) {
      base44.auth.redirectToLogin();
    }
  }, [isError]);

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

  React.useEffect(() => {
    if (userRole === 'user' && players.length > 0 && location.pathname === '/') {
      const currentPlayer = players.find(p => p.email === user.email);
      if (currentPlayer) {
        navigate(`/player-profile?id=${currentPlayer.id}`);
      }
    }
  }, [userRole, players, location.pathname, user, navigate]);

  const navigationItems = [
    { 
      title: "Dashboard", 
      url: userRole === 'coach' ? createPageUrl("CoachDashboard") : createPageUrl("Dashboard"), 
      icon: LayoutDashboard, 
      roles: ["admin", "coach"] 
    },
    {
      title: "Club",
      icon: Shield,
      roles: ["admin"],
      submenu: [
        { title: "Overview", url: createPageUrl("ClubManagement") },
        { title: "Unassigned Records", url: createPageUrl("UnassignedRecords") },
        { title: "User Management", url: createPageUrl("UserManagement") },
      ]
    },
    {
      title: "Teams",
      icon: Users,
      roles: ["admin", "coach"],
      submenu: [
        { title: "All Teams", url: createPageUrl("Teams") },
        { title: "Team Calendar", url: createPageUrl("TeamCalendar") },
        { title: "Announcements", url: createPageUrl("TeamCommunication") },
        { title: "Drills Library", url: createPageUrl("TeamDrills") },
      ]
    },
    {
      title: "Players",
      icon: Activity,
      roles: ["admin", "coach"],
      submenu: [
        { title: "All Players", url: createPageUrl("Players") },
        { title: "Tryouts", url: createPageUrl("Tryouts") },
        { title: "Assessments", url: createPageUrl("Assessments") },
        { title: "Evaluations", url: createPageUrl("EvaluationsNew") },
      ]
    },
    { 
      title: "Coaches", 
      url: createPageUrl("CoachManagement"), 
      icon: UserCog, 
      roles: ["admin"] 
    },
    { 
      title: "tryouts",
      icon: Activity,
      roles: ["admin", "coach"],
      submenu: [
        { title: "Tryouts", url: createPageUrl("tryouts") },
        { title: "Depth Chart", url: createPageUrl("Fieldview") },
        { title: "Assessments", url: createPageUrl("Assessments") },
        { title: "Evaluations", url: createPageUrl("EvaluationsNew") },
      ]
    },
    {
      title: "Bookings",
      icon: Calendar,
      roles: ["admin", "coach"],
      submenu: [
        { title: "Availability", url: createPageUrl("Availability") },
        { title: "Manage Bookings", url: createPageUrl("BookingsTable") },
        { title: "Book Session", url: createPageUrl("BookSession") },
      ]
    },
    { 
      title: "Messages", 
      url: createPageUrl("Messages"), 
      icon: MessageSquare, 
      roles: ["admin", "coach", "user"] 
    },
    { 
      title: "Book Session", 
      url: createPageUrl("BookSession"), 
      icon: Calendar, 
      roles: ["user"] 
    },
    { 
      title: "My Bookings", 
      url: createPageUrl("MyBookings"), 
      icon: Clock, 
      roles: ["user"] 
    },
  ];

  const filteredNavItems = navigationItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const isActive = (url) => location.pathname === url;
  const isSubmenuActive = (submenu) => submenu?.some(item => location.pathname === item.url);

  if (!user || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-200 transition-all">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-lg">Soccer Club</h1>
                <p className="text-[10px] text-emerald-600 font-medium -mt-1">Management System</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {filteredNavItems.map((item) => (
                item.submenu ? (
                  <DropdownMenu key={item.title}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          isSubmenuActive(item.submenu) 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.title}</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {item.submenu.map((subItem) => (
                        <DropdownMenuItem key={subItem.title} asChild>
                          <Link 
                            to={subItem.url}
                            className={`w-full ${isActive(subItem.url) ? 'bg-emerald-50 text-emerald-700' : ''}`}
                          >
                            {subItem.title}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link key={item.title} to={item.url}>
                    <Button 
                      variant="ghost"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        isActive(item.url) 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </Button>
                  </Link>
                )
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <NotificationCenter />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-slate-600">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => base44.auth.logout()}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white py-4 px-4">
            <nav className="space-y-2">
              {filteredNavItems.map((item) => (
                item.submenu ? (
                  <div key={item.title} className="space-y-1">
                    <div className="px-3 py-2 text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.title}
                    </div>
                    <div className="ml-6 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link 
                          key={subItem.title}
                          to={subItem.url}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(subItem.url) 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link 
                    key={item.title}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.url) 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                )
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}