"use client";

import { useState, useEffect } from "react";

interface AINotesProps {
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export function AINotes({ messages }: AINotesProps) {
  const [notes, setNotes] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    // Check if document is available (client-side)
    if (typeof document !== 'undefined') {
      // Initial check
      setDarkMode(document.documentElement.classList.contains('dark'));
      
      // Set up an observer to detect theme changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            setDarkMode(document.documentElement.classList.contains('dark'));
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    // Extract user messages and generate notes
    if (messages && messages.length > 0) {
      const userMessages = messages.filter(msg => msg.role === "user");
      
      if (userMessages.length > 0) {
        const newNotes: string[] = [];
        
        // Generate notes based on user messages
        userMessages.forEach(msg => {
          const content = msg.content.toLowerCase();
          
          // Project type
          if (content.includes("e-commerce") || content.includes("online store") || content.includes("shop")) {
            newNotes.push("✅ Project Type: E-commerce Store");
          } else if (content.includes("portfolio") || content.includes("showcase") || content.includes("work")) {
            newNotes.push("✅ Project Type: Portfolio Website");
          } else if (content.includes("blog") || content.includes("content") || content.includes("article")) {
            newNotes.push("✅ Project Type: Blog/Content Site");
          } else if (content.includes("business") || content.includes("company") || content.includes("corporate")) {
            newNotes.push("✅ Project Type: Business Website");
          } else if (content.includes("application") || content.includes("app") || content.includes("tool")) {
            newNotes.push("✅ Project Type: Web Application");
          } else if (content.includes("landing") || content.includes("sales") || content.includes("conversion")) {
            newNotes.push("✅ Project Type: Landing Page");
          }
          
          // Target audience
          if (content.includes("audience") || content.includes("demographic") || content.includes("user") || 
              content.includes("customer") || content.includes("client") || content.includes("visitor")) {
            const audienceMatch = content.match(/(?:audience|demographic|users?|customers?|clients?)[:\s]+(.*?)(?:[\.!\n]|$)/i);
            if (audienceMatch) {
              newNotes.push(`👥 Target Audience: ${audienceMatch[1].trim()}`);
            } else {
              newNotes.push("👥 Target Audience Mentioned");
            }
          }
          
          // Features
          if (content.includes("feature") || content.includes("function") || content.includes("capability") || 
              content.includes("able to") || content.includes("can do")) {
            newNotes.push("🛠️ Key Features Identified");
          }
          
          // Design preferences
          if (content.includes("design") || content.includes("style") || content.includes("look") || 
              content.includes("visual") || content.includes("color") || content.includes("theme") ||
              content.includes("aesthetic")) {
            newNotes.push("🎨 Design Preferences Noted");
          }
          
          // Technology
          if (content.includes("technology") || content.includes("framework") || content.includes("stack") || 
              content.includes("platform") || content.includes("language") || content.includes("react") || 
              content.includes("node") || content.includes("javascript")) {
            newNotes.push("💻 Technology Preferences Noted");
          }

          // Timeline and budget
          if (content.includes("timeline") || content.includes("deadline") || content.includes("due date") ||
              content.includes("launch") || content.includes("by when") || content.includes("schedule")) {
            newNotes.push("⏱️ Timeline Considerations Noted");
          }

          if (content.includes("budget") || content.includes("cost") || content.includes("price") ||
              content.includes("spend") || content.includes("expensive") || content.includes("cheap")) {
            newNotes.push("💰 Budget Considerations Noted");
          }
        });
        
        setNotes(Array.from(new Set(newNotes))); // Remove duplicates
      }
    }
  }, [messages]);

  if (notes.length === 0) return null;

  return (
    <div className={`fixed right-4 top-32 w-64 rounded-lg border p-4 shadow-md z-40 ${darkMode ? 'bg-black/80 border-border/30' : 'bg-white/90 border-border/70'} backdrop-blur-sm`}>
      <h3 className="text-sm font-semibold mb-2">AI Notes</h3>
      <ul className="space-y-2 text-xs">
        {notes.map((note, index) => (
          <li key={index} className="opacity-90">{note}</li>
        ))}
      </ul>
    </div>
  );
} 