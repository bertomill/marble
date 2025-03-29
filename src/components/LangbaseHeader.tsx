'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * LangbaseHeader - A modern header component for the landing page
 * 
 * This component creates a sleek navigation bar similar to Langbase's design.
 * It includes:
 * - Logo area on the left
 * - Navigation links in the center
 * - Call-to-action buttons on the right
 * - Mobile responsiveness with a hamburger menu
 * - Scroll effect that adds a subtle background when scrolling down
 */
export default function LangbaseHeader() {
  // Track if the page has been scrolled to add background effect
  const [scrolled, setScrolled] = useState(false);
  // Track if mobile menu is open
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Get current path to highlight active links
  const pathname = usePathname();

  // Add scroll listener to detect when to change header appearance
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

  // Helper function to determine if a link is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-white">Marble</span>
            <div className="ml-2 w-8 h-[3px] bg-gradient-to-r from-white/80 to-white/20 rounded-full"></div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            <Link 
              href="/products" 
              className={`text-sm font-medium transition-colors ${isActive('/products') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Products
            </Link>
            <Link 
              href="/docs" 
              className={`text-sm font-medium transition-colors ${isActive('/docs') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Docs
            </Link>
            <Link 
              href="/solutions" 
              className={`text-sm font-medium transition-colors ${isActive('/solutions') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Solutions
            </Link>
            <Link 
              href="/about" 
              className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              About
            </Link>
            <Link 
              href="/customers" 
              className={`text-sm font-medium transition-colors ${isActive('/customers') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Customers
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm font-medium transition-colors ${isActive('/pricing') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Pricing
            </Link>
            <Link 
              href="/contact" 
              className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-white' : 'text-white/80 hover:text-white'}`}
            >
              Contact
            </Link>
          </nav>

          {/* Auth/CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium bg-white text-black rounded-full px-6 py-2.5 hover:bg-white/90 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Start free
              <span className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10">
          <div className="container mx-auto px-6 py-4 space-y-3">
            <Link 
              href="/products" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>
            <Link 
              href="/docs" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link 
              href="/solutions" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </Link>
            <Link 
              href="/about" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/customers" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Customers
            </Link>
            <Link 
              href="/pricing" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/contact" 
              className="block py-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            <div className="pt-4 mt-4 border-t border-white/10 flex space-x-4">
              <Link 
                href="/login" 
                className="text-sm font-medium text-white/90 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="text-sm font-medium bg-white text-black rounded-full px-6 py-2.5 hover:bg-white/90 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start free
                <span className="ml-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 