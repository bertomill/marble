'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  Home, 
  Search, 
  Settings, 
  LogOut, 
  Plus, 
  ChevronsLeft, 
  ChevronsRight, 
  Menu,
  Users,
  Grid2x2,
  Layout,
  X,
  Moon,
  Sun,
  UserPlus,
  Clock,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { SearchDialog } from '@/components/ui/search-dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (!currentUser) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '/dashboard/explore', label: 'Explore', icon: <Grid2x2 className="h-5 w-5" /> },
    { href: '/dashboard/projects', label: 'Projects', icon: <Layout className="h-5 w-5" /> },
    { href: '/dashboard/feedback', label: 'Feedback', icon: <MessageSquare className="h-5 w-5" /> },
  ];

  const comingSoonItems = [
    { 
      href: '#', 
      label: 'Friends', 
      icon: <UserPlus className="h-5 w-5" />,
      comingSoon: true 
    },
    { 
      href: '#', 
      label: 'Team', 
      icon: <Users className="h-5 w-5" />,
      comingSoon: true 
    },
  ];

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-card dark:bg-black/40 h-full z-30 border-r border-border/50 dark:border-border/30 transform transition-all duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile close button */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted md:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User profile section with dropdown */}
        <div className="flex items-center p-5 border-b border-border/50 dark:border-border/30 justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 focus:outline-none">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="rounded-full w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-medium text-sm">
                      {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0]}</span>
                      {user?.email && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 cursor-pointer text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Collapse toggle button */}
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-muted hidden md:flex"
          >
            {sidebarCollapsed ? 
              <ChevronsRight className="h-5 w-5" /> : 
              <ChevronsLeft className="h-5 w-5" />
            }
          </button>
        </div>

        {/* Search and Theme Elements */}
        <div className="px-2 py-3 border-b border-border/50 dark:border-border/30 flex items-center gap-2">
          {!sidebarCollapsed ? (
            <div className="flex-grow">
              <SearchDialog />
            </div>
          ) : (
            <button
              className="w-full flex justify-center p-2 rounded-md hover:bg-muted/50"
              onClick={() => setSidebarCollapsed(false)}
              title="Expand to search"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
          
          <ThemeToggle />
        </div>

        {/* Create Project Button */}
        <div className="px-4 py-5">
          <Button
            onClick={() => router.push('/dashboard/create')}
            className="w-full bg-white dark:bg-zinc-800 text-primary dark:text-white flex items-center justify-center gap-2 py-5 font-medium text-base rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 group"
          >
            <Plus className="h-5 w-5" />
            {!sidebarCollapsed && <span>Create Project</span>}
          </Button>
        </div>

        {/* Main Nav Links */}
        <nav className="px-2 py-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors relative ${
                    pathname === item.href ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Coming Soon Items - positioned near the bottom */}
        <div className="px-2 py-2 mt-auto">
          <div className="border-t border-border/50 dark:border-border/30 pt-2 mb-2">
            {!sidebarCollapsed && (
              <p className="text-xs text-muted-foreground px-4 py-1">Coming soon</p>
            )}
            <ul className="space-y-1">
              {comingSoonItems.map((item) => (
                <li key={item.label}>
                  <Link 
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors relative 
                      text-muted-foreground hover:text-muted-foreground/80 hover:bg-muted/30 cursor-not-allowed
                    `}
                    title={sidebarCollapsed ? item.label : ''}
                    onClick={(e) => e.preventDefault()}
                  >
                    {item.icon}
                    {!sidebarCollapsed && (
                      <>
                        <span>{item.label}</span>
                        <span className="ml-auto text-xs font-medium bg-amber-500/20 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Soon</span>
                        </span>
                      </>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute -right-1 -top-1 h-2 w-2 bg-amber-500 rounded-full" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-card dark:bg-black/40 border-b border-border/50 dark:border-border/30 flex items-center px-4 md:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <h1 className="text-xl font-semibold ml-4">
            {navItems.find(item => item.href === pathname)?.label || 'Home'}
          </h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/95">
          {children}
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-md hover:bg-muted"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 