"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "@/components/mobile-menu"
import { CircularImage } from "@/components/ui/circular-image"

export function MainHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      if (offset > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'py-4 bg-transparent' 
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="container mx-auto relative">
        {/* Wrap the entire header content in a single rounded box */}
        <div className={`flex items-center justify-between relative rounded-full backdrop-blur-md ${
          scrolled ? 'bg-black/50 py-2 px-4' : 'bg-black/50 py-2 px-5'
        }`}>
          <div className="flex items-center gap-3">
            <CircularImage 
              src="/marble_logo_circle.png" 
              alt="Marble Logo" 
              size={30} 
              priority={true}
            />
            <Link href="/" className="font-bold text-2xl text-white">Marble</Link>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link href="#products" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">Products</Link>
            <Link href="#docs" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">Docs</Link>
            <Link href="#solutions" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">Solutions</Link>
            <Link href="#about" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">About</Link>
            <Link href="#customers" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">Customers</Link>
            <Link href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">Pricing</Link>
            <Link href="#contact" className="text-sm text-white/70 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/5">Contact</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <MobileMenu />
            <Link href="/login" className="hidden md:block text-sm text-white/80 hover:text-white">
              Login
            </Link>
            <Link href="/login">
              <Button variant="default" className="rounded-full px-5 hidden md:flex">
                Start free →
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Curved shape at bottom of header - only visible when not scrolled */}
      {!scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden translate-y-1/2">
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 h-32 w-[150%] bg-gradient-to-b from-black/5 to-transparent backdrop-blur-[2px] rounded-[100%] animate-gentle-wave"></div>
        </div>
      )}
    </header>
  )
} 