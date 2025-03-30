"use client"

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Search, Check } from 'lucide-react'

interface ResearchProgressProps {
  isActive: boolean
  onComplete?: () => void
  researchTopic?: string
}

export function AIResearchProgress({ 
  isActive, 
  onComplete,
  researchTopic = "similar websites" 
}: ResearchProgressProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Preparing to search...")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setProgress(0)
      setStatus("Preparing to search...")
      setIsComplete(false)
      return
    }

    const statuses = [
      "Analyzing requirements...",
      "Searching for relevant examples...",
      "Comparing design patterns...",
      "Evaluating user experiences...",
      "Identifying best practices...",
      "Compiling findings..."
    ]

    // Reset progress when starting
    setProgress(0)
    setIsComplete(false)
    
    let currentStatus = 0
    const statusInterval = setInterval(() => {
      if (currentStatus < statuses.length - 1) {
        currentStatus++
        setStatus(statuses[currentStatus])
      }
    }, 3000)
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((oldProgress) => {
        const newProgress = Math.min(oldProgress + 1, 100)
        
        if (newProgress === 100) {
          clearInterval(interval)
          clearInterval(statusInterval)
          setStatus("Research complete!")
          setIsComplete(true)
          if (onComplete) {
            setTimeout(() => {
              onComplete()
            }, 1000)
          }
        }
        
        return newProgress
      })
    }, 150)
    
    return () => {
      clearInterval(interval)
      clearInterval(statusInterval)
    }
  }, [isActive, onComplete])
  
  if (!isActive && !isComplete) return null
  
  return (
    <div className="bg-background border rounded-lg p-6 mb-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center mb-4">
        {isComplete ? (
          <div className="mr-3 bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        ) : (
          <div className="mr-3 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full animate-pulse">
            <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <h3 className="text-lg font-medium">
          {isComplete ? "Research Complete" : `Researching ${researchTopic}`}
        </h3>
      </div>
      
      <div className="mb-2">
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{status}</span>
        <span>{progress}%</span>
      </div>
    </div>
  )
} 