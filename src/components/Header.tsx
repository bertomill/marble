'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add scroll listener to detect when to add blur effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileDropdownOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full flex justify-center py-4 px-6">
        <div className={`w-full max-w-6xl flex items-center justify-between ${scrolled ? 'bg-white/90 backdrop-blur-sm shadow-md' : 'bg-white/80 backdrop-blur-sm'} rounded-full px-5 py-2`}>
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-semibold text-neutral-800">SiteStack</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/features" 
              className={`text-sm font-medium transition-colors ${isActive('/features') ? 'text-blue-600' : 'text-neutral-600 hover:text-blue-500'}`}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm font-medium transition-colors ${isActive('/pricing') ? 'text-blue-600' : 'text-neutral-600 hover:text-blue-500'}`}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className={`text-sm font-medium transition-colors ${isActive('/blog') ? 'text-blue-600' : 'text-neutral-600 hover:text-blue-500'}`}
            >
              Blog
            </Link>
            <Link 
              href="/competitors" 
              className={`text-sm font-medium transition-colors ${isActive('/competitors') ? 'text-blue-600' : 'text-neutral-600 hover:text-blue-500'}`}
            >
              Competitors
            </Link>
          </nav>

          {/* Auth/CTA Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleProfileDropdown}
                  className="flex items-center space-x-2"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="bg-blue-50 text-blue-600 border border-blue-200 rounded-full w-8 h-8 flex items-center justify-center">
                    <span className="font-semibold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
                
                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-medium text-neutral-800">{user.email}</p>
                      <Link 
                        href="/profile" 
                        className="mt-2 block py-2 px-3 text-sm text-neutral-600 hover:bg-gray-50 rounded-lg"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Set up profile
                      </Link>
                    </div>
                    
                    <div className="py-2">
                      <Link 
                        href="/settings" 
                        className="block px-3 py-2 text-sm text-neutral-600 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Settings
                      </Link>
                      
                      <div className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">Theme</span>
                          <div className="flex space-x-1 bg-gray-100 rounded-full p-1">
                            <button className="p-1 rounded-full bg-white" aria-label="Light theme">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button className="p-1 rounded-full" aria-label="Dark theme">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 py-2">
                      <Link 
                        href="/pricing" 
                        className="block px-3 py-2 text-sm text-neutral-600 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Pricing
                      </Link>
                      <Link 
                        href="/changelog" 
                        className="block px-3 py-2 text-sm text-neutral-600 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Changelog
                      </Link>
                      <Link 
                        href="/blog" 
                        className="block px-3 py-2 text-sm text-neutral-600 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Blog
                      </Link>
                      <Link 
                        href="/support" 
                        className="block px-3 py-2 text-sm text-neutral-600 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Support
                      </Link>
                    </div>
                    
                    <div className="border-t border-gray-100 py-2">
                      <button 
                        className="block w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-gray-50"
                        onClick={handleLogout}
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-neutral-600 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  href="/signup" 
                  className="text-sm font-medium bg-blue-600 text-white rounded-full px-4 py-2 hover:bg-blue-500 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-neutral-600 hover:text-neutral-900 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-transparent backdrop-blur-sm z-50 md:hidden">
          <div className="mx-4 py-4 space-y-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <Link 
              href="/features" 
              className={`block px-3 py-2 rounded-md ${isActive('/features') ? 'bg-blue-50 text-blue-600' : 'text-neutral-600 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className={`block px-3 py-2 rounded-md ${isActive('/pricing') ? 'bg-blue-50 text-blue-600' : 'text-neutral-600 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className={`block px-3 py-2 rounded-md ${isActive('/blog') ? 'bg-blue-50 text-blue-600' : 'text-neutral-600 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link 
              href="/competitors" 
              className={`block px-3 py-2 rounded-md ${isActive('/competitors') ? 'bg-blue-50 text-blue-600' : 'text-neutral-600 hover:bg-gray-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Competitors
            </Link>
            
            <div className="pt-4 mt-4 border-t border-gray-100">
              {user ? (
                <Link 
                  href="/profile" 
                  className="block px-3 py-2 rounded-md text-neutral-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="block px-3 py-2 rounded-md text-neutral-600 hover:bg-blue-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link 
                    href="/signup" 
                    className="block px-3 py-2 rounded-md text-blue-600 hover:bg-blue-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 