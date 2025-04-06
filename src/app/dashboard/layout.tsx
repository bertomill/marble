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
  MessageSquare,
  HelpCircle,
  Compass,
  BookOpen,
  PlusCircle,
  Bell,
  User as UserIcon
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TourWrapper, { TourButton } from './TourWrapper';
import { DashboardMobileMenu } from './dashboard-mobile-menu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
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

  // Determine which tour to show based on the current path
  const getTourType = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/dashboard/create') return 'projectCreation';
    // Add more path conditions as needed
    return 'dashboard'; // Default
  };
  
  const handleTourComplete = () => {
    setShowTour(false);
  };
  
  // Function to start tour programmatically
  const startTour = () => {
    setShowTour(true);
  };

  return (
    <TourWrapper 
      tourType={getTourType()} 
      onComplete={handleTourComplete}
      autoStart={true} // Auto start for first-time users
    >
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Sidebar - hidden on mobile */}
          <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-border/40 flex-col h-screen fixed">
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Sidebar top section */}
              <div className="px-4 py-6">
                <div className="flex items-center mb-6">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>
                      {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Button 
                    variant="outline" 
                    className="justify-start w-full" 
                    asChild
                  >
                    <Link href="/dashboard/create">
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="justify-start w-full" 
                    onClick={startTour}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Tour Guide
                  </Button>
                </div>
              </div>
              
              {/* Main navigation */}
              <nav className="flex-1 px-2 py-3 space-y-1">
                <Link 
                  href="/dashboard" 
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                
                <Link 
                  href="/dashboard/explore" 
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard/explore' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Compass className="h-4 w-4" />
                  <span>Explore</span>
                </Link>
                
                <Link 
                  href="/dashboard/projects" 
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard/projects' || pathname.includes('/dashboard/projects/') 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Projects</span>
                </Link>
                
                <Link 
                  href="/dashboard/feedback" 
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard/feedback' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Feedback</span>
                </Link>
              </nav>
              
              {/* Bottom section */}
              <div className="p-4 border-t border-border/40 mt-auto">
                <Link 
                  href="/dashboard/settings" 
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    pathname === '/dashboard/settings' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start mt-2 text-red-500"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </aside>
          
          {/* Mobile menu toggle button */}
          <button 
            className="md:hidden fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <UserIcon className="h-6 w-6" />
          </button>
          
          {/* Dashboard Mobile Menu */}
          <DashboardMobileMenu 
            open={isMobileMenuOpen} 
            onOpenChange={setIsMobileMenuOpen}
            user={user}
            onSignOut={handleSignOut}
            onStartTour={startTour}
          />
          
          {/* Main content */}
          <main className="flex-1 ml-0 md:ml-64 lg:ml-72 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TourWrapper>
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