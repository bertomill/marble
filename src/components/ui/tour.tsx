import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export type TourStep = {
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  action?: () => void; // Optional action to perform when the step is shown
};

type TourProps = {
  steps: TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
};

export function Tour({ steps, open, onOpenChange, onComplete }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  
  // Find and highlight the target element when the step changes
  useEffect(() => {
    if (!open) return;
    
    const currentTarget = steps[currentStep]?.target;
    if (!currentTarget) {
      setTargetElement(null);
      return;
    }
    
    // Give DOM time to render before querying
    const timer = setTimeout(() => {
      const element = document.querySelector(currentTarget) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight effect
        const originalOutline = element.style.outline;
        const originalZIndex = element.style.zIndex;
        const originalPosition = element.style.position;
        
        element.style.outline = '3px solid rgba(59, 130, 246, 0.8)';
        element.style.outlineOffset = '2px';
        element.style.position = 'relative';
        element.style.zIndex = '1000';
        
        return () => {
          element.style.outline = originalOutline;
          element.style.zIndex = originalZIndex;
          element.style.position = originalPosition;
        };
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentStep, steps, open]);
  
  // Execute step action if provided
  useEffect(() => {
    if (open && steps[currentStep]?.action) {
      steps[currentStep].action?.();
    }
  }, [currentStep, steps, open]);
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    onOpenChange(false);
    setCurrentStep(0);
    if (onComplete) onComplete();
  };
  
  const handleComplete = () => {
    onOpenChange(false);
    setCurrentStep(0);
    if (onComplete) onComplete();
  };
  
  const isLastStep = currentStep === steps.length - 1;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-lg p-6 shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl">{steps[currentStep]?.title}</DialogTitle>
          <button 
            onClick={handleSkip}
            className="absolute top-4 right-4 rounded-sm p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <DialogDescription className="py-4 text-base">
          {steps[currentStep]?.description}
        </DialogDescription>
        
        <DialogFooter className="flex justify-between sm:justify-between mt-4">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrevious} className="mr-2">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <Button onClick={handleNext} size="sm">
            {isLastStep ? (
              <>
                Finish
                <Check className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 