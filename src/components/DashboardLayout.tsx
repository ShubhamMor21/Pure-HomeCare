import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Monitor,
  History,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Devices', href: '/dashboard', icon: Monitor },
  { name: 'Session History', href: '/dashboard/history', icon: History },
  { name: 'Management', href: '/dashboard/management', icon: Database },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex bg-[#0a1f38] text-white overflow-hidden selection:bg-cyan-500/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <img src="/favicon.ico" alt="Logo" className="w-6 h-6 object-contain" />
              </div>

              <div>
                <h1 className="text-sm font-bold text-white tracking-tight uppercase">Pure <span className="text-cyan-400">Homecare</span></h1>
                <p className="text-[10px] text-cyan-400/50 font-bold uppercase tracking-widest">VR Terminal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 relative group',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                  )}
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-cyan-400" : "text-white/40 group-hover:text-white")} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Header */}
        <header className="h-16 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-white/60 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white/80 uppercase tracking-[0.2em]">
                {navigation.find((n) =>
                  n.href === '/dashboard'
                    ? location.pathname === '/dashboard'
                    : location.pathname.startsWith(n.href)
                )?.name || 'Terminal'}
              </h2>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all rounded-xl">
                <div className="relative">
                  <Avatar className="w-8 h-8 border border-cyan-500/30">
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a1f38] rounded-full" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white leading-none mb-1">{user?.name}</p>
                  <p className="text-[10px] text-cyan-400/50 font-bold uppercase tracking-widest leading-none">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/20" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0d2a4a] border-white/10 text-white shadow-2xl rounded-2xl p-2">
              <DropdownMenuItem asChild className="rounded-xl hover:bg-white/5 cursor-pointer">
                <NavLink to="/dashboard/profile" className="flex items-center gap-2 py-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">Profile Terminal</span>
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 rounded-xl hover:bg-red-500/10 cursor-pointer py-2">
                <LogOut className="w-4 h-4 mr-2" />
                <span className="font-semibold">Disconnect Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
