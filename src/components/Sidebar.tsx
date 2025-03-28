'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  onToggle?: (collapsed: boolean) => void;
}

export default function Sidebar({ onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Notify parent component when sidebar state changes
  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  // Handle clicks outside the profile menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => !prev);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setShowProfileMenu(false);
      // Redirect to landing page after signout
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-sidebar min-h-screen border-r border-sidebar-border fixed left-0 top-0 bottom-0 transition-all duration-300 ease-in-out z-20`}>
      {/* Logo and Toggle Button */}
      <div className="p-5 flex items-center justify-between">
        {!collapsed && <span className="text-sidebar-foreground text-xl font-bold">Marble</span>}
        <button 
          onClick={toggleCollapse} 
          className="text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            // Icon when menu is collapsed - arrow pointing right
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5">
              <path fill="currentColor" d="M48 88c0-13.3-10.7-24-24-24S0 74.7 0 88L0 424c0 13.3 10.7 24 24 24s24-10.7 24-24L48 88zM440.4 273.5c4.8-4.5 7.6-10.9 7.6-17.5s-2.7-12.9-7.6-17.5l-136-128c-9.7-9.1-24.8-8.6-33.9 1s-8.6 24.8 1 33.9L363.5 232 280 232l-128 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l128 0 83.5 0-91.9 86.5c-9.7 9.1-10.1 24.3-1 33.9s24.3 10.1 33.9 1l136-128z" />
            </svg>
          ) : (
            // Icon when menu is expanded - arrow pointing left
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5">
              <path fill="currentColor" d="M0 424c0 13.3 10.7 24 24 24s24-10.7 24-24L48 88c0-13.3-10.7-24-24-24S0 74.7 0 88L0 424zM135.6 238.5c-4.8 4.5-7.6 10.9-7.6 17.5s2.7 12.9 7.6 17.5l136 128c9.7 9.1 24.8 8.6 33.9-1s8.6-24.8-1-33.9L212.5 280l83.5 0 128 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-128 0-83.5 0 91.9-86.5c9.7-9.1 10.1-24.3 1-33.9s-24.3-10.1-33.9-1l-136 128z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Horizontal divider below title */}
      <div className="h-px bg-sidebar-border mx-3"></div>
      
      {/* Navigation Links */}
      <nav className="mt-6">
        <Link 
          href="/dashboard" 
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
        >
          <div className={collapsed ? '' : 'mr-3'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          {!collapsed && <span>Home</span>}
        </Link>
        
        <Link 
          href="/search" 
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
        >
          <div className={collapsed ? '' : 'mr-3'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {!collapsed && <span>Search</span>}
        </Link>
        
        <Link 
          href="/projects" 
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
        >
          <div className={collapsed ? '' : 'mr-3'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          {!collapsed && <span>Projects</span>}
        </Link>
        
        <Link 
          href="/screens" 
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
        >
          <div className={collapsed ? '' : 'mr-3'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          {!collapsed && <span>Screens</span>}
        </Link>
        
        <Link 
          href="/dashboard/components" 
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
        >
          <div className={collapsed ? '' : 'mr-3'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          {!collapsed && <span>Components</span>}
        </Link>
        
        <Link 
          href="/dashboard/discover" 
          className={`flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} py-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors`}
        >
          <div className={collapsed ? '' : 'mr-3'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {!collapsed && <span>Discover</span>}
        </Link>
      </nav>
      
      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {/* Horizontal divider above username */}
        <div className="h-px bg-sidebar-border mx-0 mb-3"></div>
        
        {user ? (
          <div className={`relative`} ref={profileMenuRef}>
            <button 
              onClick={toggleProfileMenu}
              className={`flex items-center w-full ${collapsed ? 'justify-center' : ''} hover:bg-sidebar-accent rounded-lg p-2 transition-colors`}
              aria-label="Toggle user menu"
            >
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <>
                  <div className="ml-3 flex-grow text-sm text-sidebar-foreground truncate text-left">
                    {user.email}
                  </div>
                  <div className="text-sidebar-foreground">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </>
              )}
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && !collapsed && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-sidebar-accent rounded-lg shadow-lg overflow-hidden border border-sidebar-border">
                <Link 
                  href="/profile" 
                  className="block w-full text-left px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  Profile
                </Link>
                <button 
                  onClick={toggleTheme}
                  className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                  <span className="ml-2">
                    {theme === 'dark' ? (
                      // Moon icon for dark mode
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      // Sun icon for light mode
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
            
            {/* Collapsed menu (shows on icon click when collapsed) */}
            {showProfileMenu && collapsed && (
              <div className="absolute bottom-full mb-2 left-0 w-32 bg-sidebar-accent rounded-lg shadow-lg overflow-hidden border border-sidebar-border">
                <div className="px-3 py-2 border-b border-sidebar-border text-xs text-sidebar-foreground truncate">
                  {user.email}
                </div>
                <Link 
                  href="/profile" 
                  className="block w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  Profile
                </Link>
                <button 
                  onClick={toggleTheme}
                  className="flex items-center justify-between w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <span>Theme</span>
                  <span className="ml-2">
                    {theme === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            href="/login" 
            className={`block ${collapsed ? 'w-10 h-10 rounded-full mx-auto flex items-center justify-center' : 'w-full text-center py-2'} bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:bg-primary-dark transition-colors`}
          >
            {collapsed ? 'L' : 'Log in'}
          </Link>
        )}
      </div>
    </div>
  );
}