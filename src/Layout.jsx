import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Users, Shield, Calendar, Activity, LogOut,
  ChevronDown, ChevronUp, Clock, BarChart3, UserCog, MessageSquare,
  TrendingUp, Settings, Menu, X, HelpCircle } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from
"@/components/ui/dropdown-menu";
import NotificationCenter from "./components/notifications/NotificationCenter";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState({});

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
    enabled: !!user
  });

  const getUserRole = () => {
    if (!user) return null;
    if (user.role === 'admin') return 'admin';
    const isCoach = coaches.find((c) => c.email === user.email);
    if (isCoach) return isCoach;
    // Check if user is a parent (has player_ids array with values)
    if (user.player_ids && user.player_ids.length > 0) return 'parent';
    return 'user';
  };

  const userRole = getUserRole();
  const currentCoach = typeof userRole === 'object' ? userRole : null;
  const roleType = currentCoach ? 'coach' : userRole;

  // For parents, ensure players are loaded before creating menu
  const parentPlayerMenuItems = React.useMemo(() => {
    if (roleType !== 'parent' || !user?.player_ids || players.length === 0) return [];
    return user.player_ids
      .map(playerId => {
        const player = players.find(p => p.id === playerId);
        if (!player) return null;
        return {
          title: player.full_name,
          url: `${createPageUrl('PlayerDashboard')}?id=${playerId}`,
          icon: Activity,
          roles: ["parent"]
        };
      })
      .filter(Boolean);
  }, [roleType, user, players]);

  React.useEffect(() => {
    if (roleType && location.pathname === '/') {
      navigate(createPageUrl('Communications'));
    }
  }, [roleType, location.pathname, navigate]);

  const getCoachTeamIds = () => {
    if (!currentCoach || !currentCoach.team_ids) return [];
    return currentCoach.team_ids;
  };

  const coachTeamIds = getCoachTeamIds();

  const navigationItems = [
    {
      title: "Club",
      icon: Shield,
      roles: ["admin"],
      submenu: [
        { title: "Overview", url: createPageUrl("ClubManagement") },
        { title: "Analytics", url: createPageUrl("Analytics") },
        { title: "Coaches Management", url: createPageUrl("CoachManagement") },
        { title: "User Management", url: createPageUrl("UserManagement") },
        { title: "Data Management", url: createPageUrl("AdminDataManagement") },
        { title: "Club Settings", url: createPageUrl("ClubSettingsAdmin") }
      ]
    },
    {
      title: "Teams",
      icon: Users,
      url: createPageUrl("Teams"),
      roles: ["admin", "coach"]
    },
    {
      title: "All Players",
      icon: Users,
      url: createPageUrl("Players"),
      roles: ["admin"]
    },
    {
      title: "Tryouts",
      icon: TrendingUp,
      roles: ["admin"],
      submenu: [
        { title: "Tryout Board", url: createPageUrl("Tryouts") },
        { title: "Team Assignments", url: createPageUrl("TeamTryout") },
        { title: "Role Assignment", url: createPageUrl("PlayerRoleAssignment") },
        { title: "Depth Chart", url: createPageUrl("FormationView") },
        { title: "Player Comparison", url: createPageUrl("PlayerComparison") },
        { title: "Advanced Analytics", url: createPageUrl("AdvancedAnalytics") }
      ]
    },
    {
      title: "Coaching Tools",
      icon: Calendar,
      roles: ["admin", "coach"],
      submenu: [
        { title: "Coach Dashboard", url: createPageUrl("coachdashboard") },
        { title: "All Bookings", url: createPageUrl("BookingsTable") },
        { title: "My Availability", url: createPageUrl("Availability") },
        { title: "Team Reports", url: createPageUrl("TeamReports") },
        { title: "Assessments", url: createPageUrl("Assessments") },
        { title: "Evaluations", url: createPageUrl("EvaluationsNew") },
        { title: "Formation View", url: createPageUrl("FormationView") },
        { title: "Fitness Resources", url: createPageUrl("FitnessResources") }
      ]
    },
    {
      title: "Player Profile",
      icon: Activity,
      roles: ["user"],
      onClick: () => {
        const currentPlayer = players.find((p) => p.email === user.email);
        if (currentPlayer) {
          navigate(`${createPageUrl('PlayerDashboard')}?id=${currentPlayer.id}`);
        }
      }
    },
    ...parentPlayerMenuItems,
    {
      title: "Book Session",
      url: createPageUrl("BookCoach"),
      icon: Calendar,
      roles: ["user", "parent"]
    },
    {
      title: "My Bookings",
      url: createPageUrl("MyBookings"),
      icon: Clock,
      roles: ["user", "parent", "coach"]
    },
    {
      title: "Communications",
      url: createPageUrl("Communications"),
      icon: MessageSquare,
      roles: ["admin", "coach", "user", "parent"]
    },
    {
      title: "FAQ",
      url: createPageUrl("FAQ"),
      icon: HelpCircle,
      roles: ["admin", "coach", "user", "parent"]
    }
  ];

  const filteredNavItems = navigationItems.filter((item) =>
    roleType && item.roles.includes(roleType)
  );

  const isActive = (url) => location.pathname === url;
  const isSubmenuActive = (submenu) => submenu?.some((item) => location.pathname === item.url);

  if (!user || !roleType) {
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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Analytics")} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-200 transition-all">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-lg">Soccer Club</h1>
                <p className="text-[10px] text-emerald-600 font-medium -mt-1">Management System</p>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {filteredNavItems.map((item) =>
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
                ) : item.onClick ? (
                  <Button
                    key={item.title}
                    variant="ghost"
                    onClick={item.onClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{item.title}</span>
                  </Button>
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
              )}
            </nav>

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
                      <p className="text-xs text-slate-500 capitalize">{roleType}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {roleType === 'admin' && (
                    <DropdownMenuItem
                      onClick={() => navigate(createPageUrl('UserManagement'))}
                      className="text-slate-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  )}
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

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white py-4 px-4 max-h-[calc(100vh-64px)] overflow-y-auto">
            <nav className="space-y-1">
              {filteredNavItems.map((item) =>
                item.submenu ? (
                  <div key={item.title} className="border-b border-slate-100">
                    <button
                      onClick={() => setExpandedMobileMenus(prev => ({...prev, [item.title]: !prev[item.title]}))}
                      className="w-full px-3 py-3 text-sm font-semibold text-slate-900 flex items-center justify-between hover:bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </div>
                      {expandedMobileMenus[item.title] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {expandedMobileMenus[item.title] && (
                      <div className="ml-6 pb-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.title || subItem.url}
                            to={subItem.url}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive(subItem.url)
                                ? 'bg-emerald-50 text-emerald-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : item.onClick ? (
                  <button
                    key={item.title}
                    onClick={() => { item.onClick(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm transition-colors text-slate-600 hover:bg-slate-100"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </button>
                ) : (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm transition-colors ${
                      isActive(item.url)
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                )
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="min-h-[calc(100vh-64px)]">
        {children}
      </main>
    </div>
  );
}