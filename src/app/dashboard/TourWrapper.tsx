'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { Tour, TourStep } from '@/components/ui/tour';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

// Define tour steps for different parts of the application
const dashboardTourSteps: TourStep[] = [
  {
    title: "Welcome to Your Dashboard!",
    description: "This is where you can track all your projects and see your progress at a glance. Let's take a quick tour to help you get familiar with the interface.",
    position: "center",
  },
  {
    title: "Dashboard Overview",
    description: "This section shows you a summary of your work. You can see how many projects you have, their completion status, and more.",
    target: ".dashboard-welcome",
    position: "bottom",
  },
  {
    title: "Project Statistics",
    description: "These cards show you key metrics about your projects. You can see total projects, completed projects, in-progress work, and system uptime.",
    target: ".dashboard-stats",
    position: "bottom",
  },
  {
    title: "Recent Projects",
    description: "Here you can see your most recent projects and their current progress. Click on any project to view more details or continue your work.",
    target: ".dashboard-recent-projects",
    position: "top",
  },
  {
    title: "Create New Project",
    description: "Ready to start something new? Click this button to create a new project and get started right away.",
    target: ".new-project-button",
    position: "left",
  },
  {
    title: "Quick Actions",
    description: "This section provides shortcuts to common tasks like creating projects, viewing all projects, or accessing settings.",
    target: ".dashboard-quick-actions",
    position: "top",
  },
  {
    title: "You're All Set!",
    description: "You now know the basics of navigating your dashboard. Feel free to explore more, and if you need help, click the Help button in the menu.",
    position: "center",
  },
];

const projectCreationTourSteps: TourStep[] = [
  {
    title: "Create Your First Project",
    description: "This page allows you to create a new project. Let's walk through the process step by step.",
    position: "center",
  },
  {
    title: "Project Name",
    description: "Start by giving your project a clear and descriptive name. This will help you identify it easily later.",
    target: ".project-name-field",
    position: "bottom",
  },
  {
    title: "Project Description",
    description: "Provide details about what your project is about. A good description helps you and your team understand the project's purpose.",
    target: ".project-description-field",
    position: "top",
  },
  {
    title: "Create Button",
    description: "Once you've filled in the project details, click this button to create your project. It will be added to your dashboard.",
    target: ".create-project-button",
    position: "left",
  },
  {
    title: "Ready to Begin!",
    description: "That's it! Fill in your project details and create your first project. You can add more projects anytime from your dashboard.",
    position: "center",
  }
];

type TourType = 'dashboard' | 'projectCreation' | 'projectDetails' | 'settings';

interface TourWrapperProps {
  children: ReactNode;
  tourType: TourType;
  onComplete?: () => void;
  autoStart?: boolean;
}

export default function TourWrapper({
  children,
  tourType,
  onComplete,
  autoStart = false,
}: TourWrapperProps) {
  const [tourOpen, setTourOpen] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const storageKey = `${tourType}-tour-completed`;
  
  // Set the appropriate tour steps based on tourType
  useEffect(() => {
    switch (tourType) {
      case 'dashboard':
        setSteps(dashboardTourSteps);
        break;
      case 'projectCreation':
        setSteps(projectCreationTourSteps);
        break;
      // Add more tour types as needed
      default:
        setSteps([]);
    }
  }, [tourType]);
  
  // Check if the tour should start automatically
  useEffect(() => {
    if (typeof window === 'undefined' || !autoStart) return;
    
    const hasCompletedTour = localStorage.getItem(storageKey) === 'true';
    if (!hasCompletedTour) {
      setTourOpen(true);
    }
  }, [autoStart, storageKey]);
  
  const handleTourComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    if (onComplete) onComplete();
  };
  
  const startTour = () => {
    setTourOpen(true);
  };
  
  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      
      <Tour 
        steps={steps} 
        open={tourOpen} 
        onOpenChange={setTourOpen} 
        onComplete={handleTourComplete} 
      />
    </TourContext.Provider>
  );
}

// Export the context so components can use it
export const TourContext = React.createContext<{
  startTour: () => void;
}>({
  startTour: () => {},
});

// Create a custom hook to use the tour context
export const useTour = () => React.useContext(TourContext);

// Helper component for tour buttons
export function TourButton() {
  const { startTour } = useTour();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border-primary/20 hover:border-primary/30 font-medium"
    >
      <HelpCircle className="h-4 w-4" />
      Show Guide
    </Button>
  );
} 