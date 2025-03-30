'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CustomChatSidebarProps {
  children: React.ReactNode;
  runtime: {
    state?: {
      messages: Message[];
      isLoading: boolean;
    };
    sendMessage: (message: string) => void;
  };
}

export function CustomChatSidebar({ children, runtime }: CustomChatSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = runtime.state?.messages || [];
  const isLoading = runtime.state?.isLoading || false;

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      runtime.sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 overflow-auto relative">
        {children}
      </div>
      
      <div className="w-[400px] border-l flex flex-col h-full bg-background" ref={chatContainerRef}>
        {/* Chat header */}
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </Avatar>
            <h3 className="font-medium text-sm">Design Assistant</h3>
          </div>
        </div>
        
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.filter(msg => msg.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={cn("flex items-start gap-3 text-sm", 
                  message.role === 'user' ? "justify-end" : ""
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 mt-0.5 bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%]",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground ml-auto" 
                      : "bg-muted"
                  )}
                >
                  <div className="prose prose-sm dark:prose-invert">
                    {message.content.split('\n').map((text, i) => (
                      <React.Fragment key={i}>
                        {text}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 mt-0.5 bg-primary">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 text-sm">
                <Avatar className="h-8 w-8 mt-0.5 bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input area */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Write a message..."
              className="min-h-[40px] max-h-[200px] resize-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 