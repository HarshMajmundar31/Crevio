import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserButton, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Shield, LogOut,
  Briefcase, ClipboardCheck, Bell, ChevronRight, Search,
  Activity, User, Wallet, Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogoIcon } from '@/components/LogoIcon';

const brandLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/campaigns', icon: Briefcase, label: 'Campaigns' },
  { to: '/applications', icon: ClipboardCheck, label: 'Applications' },
  { to: '/contracts', icon: FileText, label: 'Contracts' },
  { to: '/wallet', icon: Wallet, label: 'Wallet Hub' },
  { to: '/audit-logs', icon: Shield, label: 'Audit Logs' },
];

const creatorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/profile', icon: User, label: 'Profile & Accounts' },
  { to: '/campaigns', icon: Briefcase, label: 'Browse Campaigns' },
  { to: '/applications', icon: ClipboardCheck, label: 'Applications' },
  { to: '/contracts', icon: FileText, label: 'My Contracts' },
  { to: '/wallet', icon: Wallet, label: 'Wallet Hub' },
];

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/applications', icon: ClipboardCheck, label: 'Applications' },
  { to: '/contracts', icon: FileText, label: 'All Contracts' },
  { to: '/campaigns', icon: Briefcase, label: 'All Campaigns' },
  { to: '/decisions', icon: ClipboardCheck, label: 'Decision Engine' },
  { to: '/admin', icon: Scale, label: 'Admin Panel' },
  { to: '/wallet', icon: Wallet, label: 'Wallet Hub' },
  { to: '/audit-logs', icon: Shield, label: 'Audit Logs' },
  { to: '/users', icon: Users, label: 'Users' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { user: clerkUser } = useUser();
  const location = useLocation();
  const links = user?.role === 'admin' ? adminLinks : user?.role === 'brand' ? brandLinks : creatorLinks;
  const displayName =
    clerkUser?.fullName ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    user?.name ||
    'User';
  const displayRole = user?.role || 'member';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sidebar text-sidebar-foreground flex flex-col shrink-0 relative">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-sidebar-primary/20 via-sidebar-border to-sidebar-primary/20" />
        
        <div className="p-5 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <LogoIcon className="w-9 h-9" />
            <div>
              <span className="text-xl font-bold text-white tracking-wide">Crevio</span>
              <p className="text-[9px] text-sidebar-foreground/60 uppercase tracking-[0.15em] -mt-0.5">Contract Engine</p>
            </div>
          </Link>
        </div>

        <div className="px-4 mb-2">
          <div className="flex items-center gap-2 bg-sidebar-accent/60 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/40">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[9px] bg-sidebar-accent rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-[0.15em] px-3 py-2">Navigation</p>
          {links.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 relative',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <link.icon className="w-[16px] h-[16px]" />
                {link.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
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

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-sidebar-accent">
              {displayInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
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
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-background/70 backdrop-blur-xl border-b px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-md">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative w-8 h-8">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
            </Button>
            <div className="scale-90 origin-right">
              <UserButton afterSignOutUrl="/login" />
            </div>
          </div>
        </header>
        <div className="p-8">
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
