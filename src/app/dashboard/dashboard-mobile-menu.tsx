"use client"

import Link from "next/link"
import { User } from "firebase/auth"
import { 
  Home, 
  Compass, 
  BookOpen, 
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DashboardMobileMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  user: User | null;
  onSignOut: () => void;
  onStartTour: () => void;
}

export function DashboardMobileMenu({ 
  open, 
  onOpenChange, 
  user, 
  onSignOut,
  onStartTour
}: DashboardMobileMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader className="text-left">
          <SheetTitle>Dashboard</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link 
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
              onClick={() => onOpenChange?.(false)}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            
            <Link 
              href="/dashboard/explore"
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
              onClick={() => onOpenChange?.(false)}
            >
              <Compass className="h-5 w-5" />
              <span>Explore</span>
            </Link>
            
            <Link 
              href="/dashboard/projects"
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
              onClick={() => onOpenChange?.(false)}
            >
              <BookOpen className="h-5 w-5" />
              <span>Projects</span>
            </Link>
            
            <Link 
              href="/dashboard/feedback"
              className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
              onClick={() => onOpenChange?.(false)}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Feedback</span>
            </Link>
            
            <div className="pt-2 mt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full justify-start mb-2"
                onClick={() => {
                  onOpenChange?.(false);
                  onStartTour();
                }}
              >
                <HelpCircle className="h-5 w-5 mr-2" />
                Tour Guide
              </Button>
              
              <Link 
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted"
                onClick={() => onOpenChange?.(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start mt-2 text-red-500"
                onClick={() => {
                  onOpenChange?.(false);
                  onSignOut();
                }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
} 