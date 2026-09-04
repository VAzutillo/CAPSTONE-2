import React, { useEffect, useState, type ComponentType } from 'react';
import { 
  Shield, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { roleLabels, panelLabels, type UserRole } from '../../types/rbac';
import { API_BASE_URL } from '../../config';

type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

interface DashboardLayoutProps {
  children?: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  role: UserRole;
  userEmail: string;
  navItems: NavItem[];
  isMaintenanceMode: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentView,
  onNavigate,
  onLogout,
  role,
  userEmail,
  navItems,
  isMaintenanceMode,
}: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; label: string; count: number; targetView?: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load notifications');
        if (isMounted) {
          const items = Array.isArray(data.items) ? data.items : [];
          setNotifications(items);
          const total = typeof data.totalCount === 'number'
            ? data.totalCount
            : items.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          setUnreadCount(total);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 sticky top-0 h-screen z-30">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-neutral-900">{panelLabels[role]}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-neutral-200 z-50 transform transition-transform duration-200 ease-in-out md:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-neutral-900">{panelLabels[role]}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6 text-neutral-500" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentView === item.id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-20 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            {isMaintenanceMode && (
              <span className="hidden md:inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Maintenance Mode Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 min-w-[0.75rem] h-3 px-0.5 rounded-full bg-red-500 text-[10px] leading-3 text-white flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-30">
                  <div className="px-3 py-2 border-b border-neutral-100 text-xs font-medium text-neutral-500">
                    Notifications
                  </div>
                  <div className="max-h-64 overflow-y-auto text-sm">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-3 text-neutral-500 text-xs">No notifications.</div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center justify-between gap-2"
                          onClick={() => {
                            if (item.targetView) {
                              onNavigate(item.targetView);
                            }
                            setShowNotifications(false);
                          }}
                        >
                          <span className="text-xs text-neutral-700">{item.label}</span>
                          {item.count > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-neutral-900 text-white text-[10px] px-2 py-0.5">
                              {item.count}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-neutral-200 mx-1"></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-neutral-50 p-2 rounded-lg transition-colors outline-none">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-neutral-900 truncate max-w-[180px]" title={userEmail}>
                      {userEmail || roleLabels[role]}
                    </p>
                    <p className="text-xs text-neutral-500">{roleLabels[role]}</p>
                  </div>
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={onLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};
