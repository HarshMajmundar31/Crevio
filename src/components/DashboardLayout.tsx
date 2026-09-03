import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserButton, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Shield, LogOut,
  Briefcase, ClipboardCheck, ChevronRight, Search,
  Activity, User, Wallet, Scale, Menu, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoIcon } from '@/components/LogoIcon';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { subscribeToRealtimeEvents } from '@/lib/socket-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const brandLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/campaigns', icon: Briefcase, label: 'Campaigns' },
  { to: '/campaigns/working', icon: Activity, label: 'Working Campaigns' },
  { to: '/applications', icon: ClipboardCheck, label: 'Applications' },
  { to: '/contracts', icon: FileText, label: 'Contracts' },
  { to: '/wallet', icon: Wallet, label: 'Wallet Hub' },
  { to: '/audit-logs', icon: Shield, label: 'Audit Logs' },
];

const creatorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/campaigns/working', icon: Activity, label: 'Working Campaigns' },
  { to: '/campaigns', icon: Briefcase, label: 'Browse Campaigns' },
  { to: '/applications', icon: ClipboardCheck, label: 'Applications' },
  { to: '/contracts', icon: FileText, label: 'My Contracts' },
  { to: '/profile', icon: User, label: 'Profile & Accounts' },
  { to: '/wallet', icon: Wallet, label: 'Wallet Hub' },
];

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/campaigns/working', icon: Activity, label: 'Working Campaigns' },
  { to: '/campaigns', icon: Briefcase, label: 'All Campaigns' },
  { to: '/applications', icon: ClipboardCheck, label: 'Applications' },
  { to: '/contracts', icon: FileText, label: 'All Contracts' },
  { to: '/decisions', icon: ClipboardCheck, label: 'Decision Engine' },
  { to: '/admin', icon: Scale, label: 'Admin Panel' },
  { to: '/wallet', icon: Wallet, label: 'Wallet Hub' },
  { to: '/audit-logs', icon: Shield, label: 'Audit Logs' },
  { to: '/users', icon: Users, label: 'Users' },
];

function SidebarContent({ links, location, displayName, displayInitial, displayRole, logout, isMobile = false, isCollapsed = false, toggleSidebar }: any) {
  return (
    <TooltipProvider delayDuration={150}>
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-sidebar-primary/20 via-sidebar-border to-sidebar-primary/20" />
      
      {/* Header Logo */}
      <div className={cn("p-4 flex items-center transition-all duration-300", isCollapsed && !isMobile ? "justify-center px-2" : "justify-between")}>
        <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <LogoIcon className="w-8 h-8 shrink-0" />
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="whitespace-nowrap overflow-hidden"
            >
              <span className="text-xl font-bold text-white tracking-wide">Crevio</span>
              <p className="text-[9px] text-sidebar-foreground/60 uppercase tracking-[0.15em] -mt-0.5">Contract Engine</p>
            </motion.div>
          )}
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 hidden md:flex"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Search Bar */}
      {(!isCollapsed || isMobile) ? (
        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 bg-sidebar-accent/60 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/40">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[9px] bg-sidebar-accent rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
          </div>
        </div>
      ) : (
        <div className="px-2 mb-2 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/40 hover:text-white hover:bg-sidebar-accent/50">
                <Search className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Search (⌘K)</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto hide-scrollbar">
        {(!isCollapsed || isMobile) && (
          <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-[0.15em] px-3 py-1.5">Navigation</p>
        )}
        {links.map((link: any) => {
          const isActive = location.pathname === link.to;
          const linkElement = (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center rounded-lg text-[13px] transition-all duration-200 relative group',
                isCollapsed && !isMobile ? 'justify-center p-2.5 h-10 w-10 mx-auto' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              {isActive && !isMobile && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {isActive && isMobile && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary" />
              )}
              <link.icon className={cn("shrink-0", isCollapsed && !isMobile ? "w-5 h-5" : "w-[16px] h-[16px]")} />
              {(!isCollapsed || isMobile) && (
                <>
                  <span className="truncate">{link.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                </>
              )}
            </Link>
          );

          if (isCollapsed && !isMobile) {
            return (
              <Tooltip key={link.to}>
                <TooltipTrigger asChild>
                  {linkElement}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {link.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkElement;
        })}
      </nav>

      {/* System Status - Only in Expanded Mode */}
      {(!isCollapsed || isMobile) && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">System Active</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-sidebar-foreground/40">
            <span>Engine v2.1</span>
            <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5" /> 99.9% uptime</span>
          </div>
        </div>
      )}

      {/* User Footer */}
      <div className={cn("border-t border-sidebar-border/50 transition-all duration-300", isCollapsed && !isMobile ? "p-2 flex flex-col items-center gap-2" : "p-4")}>
        {(!isCollapsed || isMobile) ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-sidebar-accent shrink-0">
                {displayInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-sidebar-foreground/40 capitalize font-medium">{displayRole} Account</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void logout();
              }}
              className="w-full justify-start text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs mt-1 h-8"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </Button>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  void logout();
                }}
                className="w-9 h-9 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign Out ({displayName})</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { user: clerkUser } = useUser();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crevio_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('crevio_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'brand' ? brandLinks : creatorLinks;
  const displayName =
    clerkUser?.fullName ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    user?.name ||
    'User';
  const displayRole = user?.role || 'member';
  const displayInitial = displayName.charAt(0).toUpperCase();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Real-time events
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeEvents((event) => {
      console.log('[Real-time Event]', event);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      if (event.type === 'notification' || event.type === 'CONTRACT_EVENT') {
        const payload = event.payload || {};
        toast(payload.title || 'New Notification', {
          description: payload.message || 'You have a new update.',
        });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const sidebarProps = {
    links,
    location,
    displayName,
    displayInitial,
    displayRole,
    logout,
    isCollapsed,
    toggleSidebar,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sliding Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground hidden md:flex flex-col shrink-0 relative z-20 transition-all duration-300 ease-in-out border-r border-sidebar-border",
          isCollapsed ? "w-[68px]" : "w-[250px]"
        )}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto w-full flex flex-col relative z-10 transition-all duration-300">
        <header className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[260px] p-0 bg-sidebar text-sidebar-foreground border-r-sidebar-border" aria-describedby={undefined}>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full relative">
                  <SidebarContent {...sidebarProps} isMobile={true} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Quick Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hidden md:flex text-muted-foreground hover:text-foreground h-8 w-8"
              title={isCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-md">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <div className="scale-90 origin-right ml-1">
              <UserButton afterSignOutUrl="/login" />
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
