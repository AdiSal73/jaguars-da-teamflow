import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Users, Shield, Calendar, Activity, LogOut,
  ChevronDown, ChevronUp, Clock, BarChart3, UserCog, MessageSquare,
  TrendingUp, Settings, Menu, X, HelpCircle, User as UserIcon, Search, Trophy } from
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
import GlobalSearch from "./components/search/GlobalSearch";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState({});
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const { data: user, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const isPublicPage = location.pathname === createPageUrl('PublicCoachBooking') || 
                       location.pathname === createPageUrl('Landing') ||
                       location.pathname === '/';

  React.useEffect(() => {
    if (isError && !isPublicPage) {
      const currentPath = location.pathname;
      const publicPaths = [createPageUrl('PublicCoachBooking'), createPageUrl('Landing')];
      if (!publicPaths.some(path => currentPath.startsWith(path))) {
        base44.auth.redirectToLogin();
      }
    }
  }, [isError, isPublicPage, location.pathname]);

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
    if (user.role === 'director') return 'director';
    const isCoach = coaches.find((c) => c.email === user.email);
    if (isCoach) return isCoach;
    if (user.player_ids && user.player_ids.length > 0) return 'parent';
    return 'user';
  };

  const userRole = getUserRole();
  const currentCoach = typeof userRole === 'object' ? userRole : null;
  const roleType = currentCoach ? 'coach' : userRole;

  const parentPlayerIds = user?.player_ids || [];

  const parentPlayerMenuItems = React.useMemo(() => {
    if (roleType !== 'parent' || !parentPlayerIds?.length || !players?.length) return [];
    return parentPlayerIds
      .map(playerId => {
        const player = players.find(p => p.id === playerId);
        if (!player) return null;
        return {
          title: `${player.full_name}'s Dashboard`,
          url: `${createPageUrl('PlayerDashboard')}?id=${playerId}`,
          icon: Activity,
          roles: ["parent"]
        };
      })
      .filter(Boolean);
  }, [roleType, parentPlayerIds, players]);

  React.useEffect(() => {
    if (roleType && location.pathname === '/') {
      if (roleType === 'parent') {
        navigate(createPageUrl('ParentPortal'));
      } else {
        navigate(createPageUrl('Communications'));
      }
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
        { title: "All Bookings", url: createPageUrl("BookingsTable") },
        { title: "Coaches Management", url: createPageUrl("CoachManagement") },
        { title: "User Management", url: createPageUrl("UserManagement") },
        { title: "Data Management", url: createPageUrl("AdminDataManagement") },
        { title: "Email Templates", url: createPageUrl("EmailTemplates") },
        { title: "Email System", url: createPageUrl("EmailTestPage") },
        { title: "Contacts Manager", url: createPageUrl("ContactsManager") },
        { title: "Club Settings", url: createPageUrl("ClubSettingsAdmin") }
      ]
    },
    {
      title: "Teams",
      icon: Users,
      roles: ["admin", "coach", "director"],
      submenu: [
        { title: "All Teams", url: createPageUrl("Teams") },
        { title: "All Players", url: createPageUrl("Players") },
        { title: "Leaderboards", url: createPageUrl("Leaderboard") }
      ]
    },
    {
      title: "Tryouts",
      icon: TrendingUp,
      roles: ["admin", "director"],
      submenu: [
        { title: "Tryout Board", url: createPageUrl("Tryouts") },
        { title: "Team Assignments", url: createPageUrl("TeamTryout") },
        { title: "Position Assignments", url: createPageUrl("PositionAssignments") },
        { title: "Outside Players", url: createPageUrl("TryoutPlayers") },
        { title: "Scouting Pipeline", url: createPageUrl("ScoutingPipeline") },
        { title: "Role Assignment", url: createPageUrl("PlayerRoleAssignment") },
        { title: "Depth Chart", url: createPageUrl("FormationView") },
        { title: "Player Comparison", url: createPageUrl("PlayerComparison") },
        { title: "Advanced Analytics", url: createPageUrl("AdvancedAnalytics") }
      ]
    },
    {
      title: "Coaching Tools",
      icon: Calendar,
      roles: ["admin", "coach", "director"],
      submenu: [
        { title: "Coach Dashboard", url: createPageUrl("coachdashboard") },
        { title: "My Availability", url: createPageUrl("coachAvailability") },
        { title: "Team Reports", url: createPageUrl("TeamReports") },
        { title: "Assessments", url: createPageUrl("Assessments") },
        { title: "Evaluations", url: createPageUrl("EvaluationsNew") },
        { title: "Evaluation Analytics", url: createPageUrl("EvaluationAnalytics") },
        { title: "Formation View", url: createPageUrl("FormationView") },
      ]
    },
    {
      title: "Coaching Resources",
      icon: Trophy,
      roles: ["admin", "coach", "director", "user", "parent"],
      submenu: [
        { title: "Coaching Resources", url: createPageUrl("CoachingResources") },
        { title: "Knowledge Bank", url: createPageUrl("JaguarsKnowledgeBank") },
        { title: "Fitness Resources", url: createPageUrl("FitnessResources") },
        { title: "PDP 2025", url: createPageUrl("PDPViewer") }
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
      url: createPageUrl("Bookingpage"),
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
      title: "My Account",
      url: createPageUrl("UserDashboard"),
      icon: UserIcon,
      roles: ["coach"]
    },
    {
      title: "Communications",
      icon: MessageSquare,
      roles: ["admin", "coach", "user", "parent", "director"],
      url: createPageUrl("Communications")
    },
    {
      title: "My Account",
      url: createPageUrl("UserDashboard"),
      icon: UserIcon,
      roles: ["user"]
    }
  ];

  const filteredNavItems = navigationItems.filter((item) =>
    roleType && item.roles.includes(roleType)
  );

  const isActive = (url) => location.pathname === url;
  const isSubmenuActive = (submenu) => submenu?.some((item) => location.pathname === item.url);

  if ((!user || !roleType) && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (isPublicPage && !user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to={createPageUrl("landing")} className="flex items-center gap-2 sm:gap-3 group">
              <img 
                src="https://ssprodst.blob.core.windows.net/logos/58/2821a300-9ff6-46d2-a00b-73be4dc4f316-04-02-2025-07-54-52-995.png" 
                alt="Michigan Jaguars" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg group-hover:shadow-emerald-200 transition-all object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg">Michigan Jaguars</h1>
                <p className="text-[9px] sm:text-[10px] text-emerald-600 font-medium -mt-1">Player and Team Development</p>
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
                      {item.submenu?.map((subItem) => (
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGlobalSearch(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <Search className="w-5 h-5" />
              </Button>
              {user && <NotificationCenter />}

              {(() => {
                const actingAsUser = typeof window !== 'undefined' ? localStorage.getItem('actingAsUser') : null;
                const isActing = actingAsUser && user?.role === 'admin';

                if (isActing) {
                  let actingAsData;
                  try {
                    actingAsData = JSON.parse(actingAsUser);
                  } catch (e) {
                    actingAsData = null;
                  }

                  return (
                    <Button
                      onClick={() => {
                        localStorage.removeItem('actingAsUser');
                        window.location.reload();
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg animate-pulse"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Stop Acting As {actingAsData?.full_name}
                    </Button>
                  );
                }

                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user?.full_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
                        </div>
                        {user && (
                          <div className="hidden md:block text-left">
                            <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-slate-500 capitalize">{roleType}</p>
                          </div>
                        )}
                        <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {user ? (
                        <>
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
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => base44.auth.redirectToLogin()}
                          className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          Login / Register
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()}

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
                        {item.submenu?.map((subItem) => (
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

      <GlobalSearch open={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </div>
  );
}