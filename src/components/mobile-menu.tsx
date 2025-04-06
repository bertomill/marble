"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MobileMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-black/90 border-white/10">
        <SheetHeader>
          <SheetTitle className="text-left text-white">Marble</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-6">
          <Link 
            href="#products" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Products
          </Link>
          <Link 
            href="#docs" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Docs
          </Link>
          <Link 
            href="#solutions" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Solutions
          </Link>
          <Link 
            href="#about" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            About
          </Link>
          <Link 
            href="#customers" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Customers
          </Link>
          <Link 
            href="#pricing" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link 
            href="#contact" 
            className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            Contact
          </Link>
          
          <div className="flex flex-col space-y-2 mt-4 pt-4 border-t border-white/10">
            <Link 
              href="/login" 
              className="px-2 py-1 text-sm text-white/70 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Button className="rounded-full mt-2">
              Start free →
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
} 