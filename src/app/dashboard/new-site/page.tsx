'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { SendHorizontalIcon, CheckIcon, EditIcon, PlusCircleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

// New interface for business info summary display
interface BusinessInfoField {
  key: string;
  label: string;
  value: string | string[];
  type: 'text' | 'array';
}

type Message = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
};

// Business information that we're trying to collect
type BusinessInfo = {
  [key: string]: string | string[] | undefined;
};

// Completion status of fact collection
type CompletionStatus = {
  factsCollected: number;
  isComplete: boolean;
  missingFactTypes: string[];
};

// Helper function to format text with basic markdown-like formatting
const formatText = (text: string): string => {
  // Replace **bold** with <strong>bold</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace *italic* with <em>italic</em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Replace links [text](url) with <a href="url">text</a>
  formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Replace newlines with <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
};

export default function NewSite() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | string[]>('');
  const [apiKeyError, setApiKeyError] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    factsCollected: 0,
    isComplete: false,
    missingFactTypes: []
  });
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'initial-greeting',
      type: 'assistant',
      content: "Hi there! I'm your SiteStack design consultant. I'd love to help you create your perfect website. Could you tell me about your business or project?",
      suggestions: [
        "I'm starting an online store",
        "I need a business website",
        "I want a portfolio site",
        "I'm a service provider"
      ]
    }
  ]);

  // Function to check if we have enough info to show the summary - moved inside component
  const hasEnoughInfo = (): boolean => {
    // Use the completion status to determine if we have enough facts
    return completionStatus.isComplete || completionStatus.factsCollected >= 5;
  };

  // Create a ref for the message container
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if we should show the business info summary
  useEffect(() => {
    if (hasEnoughInfo() && !showSummary) {
      setShowSummary(true);
    }
  }, [businessInfo, showSummary, completionStatus]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  // Start editing a field
  const handleEditField = (field: BusinessInfoField) => {
    setEditingField(field.key);
    setEditValue(field.value);
  };

  // Save edited field
  const handleSaveField = () => {
    if (editingField) {
      setBusinessInfo(prev => ({
        ...prev,
        [editingField]: editValue
      }));
      setEditingField(null);
    }
  };

  // Save the project to the database
  const saveProject = async () => {
    setIsSaving(true);
    try {
      // Save to sessionStorage first for cross-page access
      try {
        sessionStorage.setItem('businessInfo', JSON.stringify(businessInfo));
      } catch (storageError) {
        // Handle sessionStorage errors (e.g., incognito mode, storage quota exceeded)
        console.warn('Unable to use sessionStorage:', storageError);
        // Continue anyway since we can still pass data via URL or use the database
      }
      
      try {
        // Optional: Still save to database if API is available
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: Object.entries(businessInfo).find(([key]) => key.toLowerCase().includes('nature'))?.at(1) || 'New Website',
            businessInfo
          }),
        });
        
        // Only await the response if the API call succeeds, otherwise continue
        if (response.ok) {
          await response.json();
        }
      } catch (apiError) {
        // Log the API error but continue to the next page
        console.warn('Could not save to API, but continuing:', apiError);
      }

      // Always redirect to analysis page regardless of API success
      router.push('/analysis');
      
    } catch (error) {
      console.error('Error in save flow:', error);
      
      // Show error message to user
      setMessages(prev => [...prev, { 
        id: `error-${Date.now()}`, 
        type: 'assistant', 
        content: 'Sorry, there was an error saving your information. Please try again.',
      }]);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: inputValue
    };

    // Add user message to chat immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setApiKeyError(false); // Reset error state on new message

    try {
      // First, process the message with the main chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(msg => ({
            type: msg.type,
            content: msg.content
          })),
          userInfo: businessInfo, // Pass current business info for context
        }),
      });

      if (!response.ok) {
        // Handle API error specifically
        const errorData = await response.json().catch(() => ({}));
        
        // Create a user-friendly error message
        let errorMessage = 'Sorry, there was an error processing your request.';
        if (errorData.error && errorData.error.includes('OpenAI API key')) {
          errorMessage = 'The OpenAI API key is not properly configured. Please contact the administrator to set up a valid API key.';
        }
        
        throw new Error(errorMessage);
      }

      let assistantContent = '';

      // Handle streaming response from OpenAI
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        
        // Create placeholder for assistant message
        const assistantId = `assistant-${Date.now()}`;
        setMessages(prev => [...prev, { 
          id: assistantId, 
          type: 'assistant', 
          content: ''
        }]);

        // Read the stream and update the message incrementally
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Process the chunk to extract the actual text content
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            // Process each line based on the format pattern
            if (line.startsWith('0:"') || line.startsWith('0: "')) {
              // Extract the text content between quotes
              const textMatch = line.match(/0:(?:\s*)"(.*?)"/);
              if (textMatch && textMatch[1]) {
                assistantContent += textMatch[1];
                
                // Update the assistant message in state
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, content: assistantContent } 
                    : msg
                ));
              }
            } else if (line.startsWith('0:')) {
              // For lines like 0:Hello without quotes
              const content = line.substring(2).trim();
              if (content) {
                assistantContent += content;
                
                // Update the assistant message in state
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantId 
                    ? { ...msg, content: assistantContent } 
                    : msg
                ));
              }
            }
            // Ignore other format lines (f:, e:, d:, etc.)
          }
        }
      }

      // After the main response, get suggestions from the next-question API
      const nextQuestionResponse = await fetch('/api/chat/next-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: [
            ...messages,
            userMessage,
            { type: 'assistant', content: assistantContent }
          ].map(msg => ({
            type: msg.type,
            content: msg.content
          })),
          currentInfo: businessInfo
        }),
      });

      if (!nextQuestionResponse.ok) {
        console.warn('Failed to get next question:', nextQuestionResponse.status);
        return; // Continue without suggestions if this fails
      }

      const nextQuestionData = await nextQuestionResponse.json();
      
      // Update the business info with any extracted information
      if (nextQuestionData.suggestedInfo) {
        setBusinessInfo(prev => ({
          ...prev,
          ...nextQuestionData.suggestedInfo
        }));
      }
      
      // Update completion status if provided
      if (nextQuestionData.completionStatus) {
        setCompletionStatus(nextQuestionData.completionStatus);
        
        // If we've collected all 5 facts, show the summary
        if (nextQuestionData.completionStatus.isComplete && !showSummary) {
          setShowSummary(true);
        }
      }

      // Add suggestions to the last message
      setMessages(prev => {
        const lastIndex = prev.length - 1;
        const lastMessage = prev[lastIndex];
        
        if (lastMessage.type === 'assistant') {
          return [
            ...prev.slice(0, lastIndex),
            {
              ...lastMessage,
              suggestions: nextQuestionData.options || []
            }
          ];
        }
        return prev;
      });

    } catch (error) {
      console.error('Error in chat flow:', error);
      
      // Check if it's an API key error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('API key')) {
        setApiKeyError(true);
      }
      
      // Add an error message
      setMessages(prev => [...prev, { 
        id: `error-${Date.now()}`, 
        type: 'assistant', 
        content: errorMessage,
        suggestions: [
          "Try again",
          "Start over",
          "Contact support"
        ]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show the final summary instead of suggestions
  const showFinalProjectSummary = () => {
    setShowFinalSummary(true);
    scrollToBottom();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-white">
      <div className="flex-grow flex flex-col">
        {/* Sidebar would normally go here */}
        
        {/* Main content area - centered like Perplexity */}
        <div className="flex-grow flex flex-col items-center pt-20 px-4 md:px-8">
          <div className="w-full max-w-3xl mx-auto">
            {/* Main heading */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-2">Create Your SiteStack Website</h1>
              <p className="text-xl text-neutral-300">Tell us about your business to get started</p>
            </div>
            
            {/* API Key Warning Banner */}
            {apiKeyError && (
              <div className="mb-8 bg-amber-800/20 border border-amber-700 rounded-lg p-4 text-amber-200">
                <h3 className="font-semibold text-amber-100 mb-1">OpenAI API Key Not Configured</h3>
                <p>The application cannot connect to OpenAI because the API key is missing or invalid. To fix this:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Get an API key from <a href="https://platform.openai.com/api-keys" className="underline" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></li>
                  <li>Add this key to your <code className="bg-amber-900/30 px-1 rounded">.env.local</code> file</li>
                  <li>Restart the application</li>
                </ol>
              </div>
            )}
            
            {/* Final Business Info Summary - shown when user clicks "Review Project" */}
            {showFinalSummary && (
              <div className="mb-12 bg-[#1a1a1a] rounded-xl p-6 border border-neutral-700 animate-fadeIn">
                <h2 className="text-2xl font-semibold mb-4">Your Key Business Facts</h2>
                <p className="text-neutral-300 mb-4">
                  Here are the 5 key facts we&apos;ve collected about your business. Please review and edit if needed before we create your website.
                </p>
                
                <div className="space-y-4">
                  {Object.entries(businessInfo).map(([key, value]) => (
                    <div key={key} className="border-b border-neutral-700 pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-neutral-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        
                        {editingField === key ? (
                          <button 
                            onClick={handleSaveField} 
                            className="text-green-400 hover:text-green-300 p-1 rounded-full"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleEditField({
                              key,
                              label: key.replace(/([A-Z])/g, ' $1').trim(),
                              value: value as string | string[],
                              type: Array.isArray(value) ? 'array' : 'text'
                            })} 
                            className="text-neutral-400 hover:text-white p-1 rounded-full"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {editingField === key ? (
                        Array.isArray(value) ? (
                          <div className="space-y-2">
                            {(value as string[]).map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={item}
                                  onChange={(e) => {
                                    const newArray = [...(value as string[])];
                                    newArray[index] = e.target.value;
                                    setEditValue(newArray);
                                  }}
                                  className="flex-grow bg-[#222222] px-3 py-1 rounded-lg border border-neutral-600 text-white"
                                />
                                <button 
                                  onClick={() => {
                                    const newArray = [...(value as string[])];
                                    newArray.splice(index, 1);
                                    setEditValue(newArray);
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                            
                            {/* Add new item input */}
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                placeholder="Add new item..."
                                value={Array.isArray(value) && (value as string[]).length > 0 ? '' : (editValue as string)}
                                onChange={(e) => {
                                  if (Array.isArray(value) && (value as string[]).length === 0) {
                                    setEditValue(e.target.value);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    setEditValue([...(value as string[]), e.currentTarget.value.trim()]);
                                    e.currentTarget.value = '';
                                  }
                                }}
                                className="flex-grow bg-[#222222] px-3 py-1 rounded-lg border border-neutral-600 text-white"
                              />
                              <button 
                                onClick={() => {
                                  const input = document.activeElement as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    setEditValue([...(value as string[]), input.value.trim()]);
                                    input.value = '';
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <PlusCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input 
                            type="text" 
                            value={editValue as string}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-[#222222] px-3 py-2 rounded-lg border border-neutral-600 text-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveField();
                              }
                            }}
                          />
                        )
                      ) : (
                        Array.isArray(value) ? (
                          <div className="space-y-1">
                            {(value as string[]).length > 0 ? (
                              (value as string[]).map((item, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full mt-0.5"></div>
                                  <span className="text-white">{item}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-neutral-500 italic">No items added</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-white">{value as string}</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={saveProject}
                    disabled={isSaving}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Create My Website</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Progress bar for collecting the 5 facts */}
            {!showFinalSummary && completionStatus.factsCollected > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-neutral-300">Collecting key information</span>
                  <span className="text-neutral-300">{completionStatus.factsCollected}/5 facts</span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: `${(completionStatus.factsCollected / 5) * 100}%` }}
                  ></div>
                </div>
                {completionStatus.missingFactTypes.length > 0 && (
                  <div className="mt-1 text-xs text-neutral-400">
                    Still needed: {completionStatus.missingFactTypes.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            {/* Regular Business Info Summary - only shown when we have enough info but not in final review */}
            {showSummary && !showFinalSummary && (
              <div className="mb-12 bg-[#1a1a1a] rounded-xl p-6 border border-neutral-700">
                <h2 className="text-2xl font-semibold mb-4">Your Business Facts</h2>
                <p className="text-neutral-300 mb-4">
                  Great! We&apos;ve collected 5 key facts about your business. Review them below before proceeding.
                </p>
                
                <div className="space-y-4">
                  {Object.entries(businessInfo).map(([key, value]) => (
                    <div key={key} className="border-b border-neutral-700 pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-neutral-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        
                        {editingField === key ? (
                          <button 
                            onClick={handleSaveField} 
                            className="text-green-400 hover:text-green-300 p-1 rounded-full"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleEditField({
                              key,
                              label: key.replace(/([A-Z])/g, ' $1').trim(),
                              value: value as string | string[],
                              type: Array.isArray(value) ? 'array' : 'text'
                            })} 
                            className="text-neutral-400 hover:text-white p-1 rounded-full"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {editingField === key ? (
                        Array.isArray(value) ? (
                          <div className="space-y-2">
                            {(value as string[]).map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={item}
                                  onChange={(e) => {
                                    const newArray = [...(value as string[])];
                                    newArray[index] = e.target.value;
                                    setEditValue(newArray);
                                  }}
                                  className="flex-grow bg-[#222222] px-3 py-1 rounded-lg border border-neutral-600 text-white"
                                />
                                <button 
                                  onClick={() => {
                                    const newArray = [...(value as string[])];
                                    newArray.splice(index, 1);
                                    setEditValue(newArray);
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                            
                            {/* Add new item input */}
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                placeholder="Add new item..."
                                value={Array.isArray(value) && (value as string[]).length > 0 ? '' : (editValue as string)}
                                onChange={(e) => {
                                  if (Array.isArray(value) && (value as string[]).length === 0) {
                                    setEditValue(e.target.value);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    e.preventDefault();
                                    setEditValue([...(value as string[]), e.currentTarget.value.trim()]);
                                    e.currentTarget.value = '';
                                  }
                                }}
                                className="flex-grow bg-[#222222] px-3 py-1 rounded-lg border border-neutral-600 text-white"
                              />
                              <button 
                                onClick={() => {
                                  const input = document.activeElement as HTMLInputElement;
                                  if (input && input.value.trim()) {
                                    setEditValue([...(value as string[]), input.value.trim()]);
                                    input.value = '';
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <PlusCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input 
                            type="text" 
                            value={editValue as string}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full bg-[#222222] px-3 py-2 rounded-lg border border-neutral-600 text-white"
                          />
                        )
                      ) : (
                        Array.isArray(value) ? (
                          <div className="space-y-1">
                            {(value as string[]).length > 0 ? (
                              (value as string[]).map((item, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full mt-0.5"></div>
                                  <span className="text-white">{item}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-neutral-500 italic">No items added</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-white">{value as string}</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={showFinalProjectSummary}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CheckIcon className="w-5 h-5" />
                    <span>Review Your Website Project</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Messages container - Only show if not in final summary mode */}
            {!showFinalSummary && (
              <div className="space-y-8 mb-20">
                {/* Only show messages */}
                {messages.map((message, index) => {
                  // Check if this is the last assistant message
                  const isLastAssistantMessage = message.type === 'assistant' && 
                    messages.slice(index + 1).every(m => m.type !== 'assistant');
                  
                  // Check if this is the first assistant message to determine placeholder text
                  const isFirstAssistantMessage = message.type === 'assistant' && 
                    message.id === 'initial-greeting';

                  // Check if we have enough data to offer the "Review Your Website" option
                  const canShowReviewOption = isLastAssistantMessage && 
                    completionStatus.isComplete;
                  
                  return (
                    <div key={message.id} className="fade-in">
                      {message.type === 'user' ? (
                        // User message
                        <div className="flex justify-end mb-6">
                          <div className="bg-gray-700 px-4 py-3 rounded-lg max-w-[80%]">
                            <div 
                              className="markdown-content text-white"
                              dangerouslySetInnerHTML={{ __html: formatText(message.content) }} 
                            />
                          </div>
                        </div>
                      ) : (
                        // Assistant message
                        <div className="mb-4">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mt-1">
                              <span className="text-white font-semibold">A</span>
                            </div>
                            <div className="flex-grow">
                              <div 
                                className="markdown-content text-white text-lg"
                                dangerouslySetInnerHTML={{ __html: formatText(message.content) }} 
                              />
                              
                              {/* Review Project Button - Show after enough info collected and it's the last message */}
                              {canShowReviewOption && (
                                <div className="mt-4">
                                  <button
                                    onClick={showFinalProjectSummary}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                  >
                                    <CheckIcon className="w-5 h-5" />
                                    <span>Review Your Website Project</span>
                                  </button>
                                </div>
                              )}
                              
                              {/* Suggestion bubbles directly under message */}
                              {message.suggestions && message.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {message.suggestions.map((suggestion, index) => (
                                    <button
                                      key={index}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="text-xs bg-transparent hover:bg-[#2a2a2a] text-gray-400 hover:text-white px-3 py-1.5 rounded-md transition-colors whitespace-normal border border-neutral-800 hover:border-neutral-700"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {/* Input field after the last assistant message */}
                              {isLastAssistantMessage && !isLoading && (
                                <div className="mt-8 max-w-2xl">
                                  <form onSubmit={handleSubmit} className="flex flex-col">
                                    <div className="relative w-full">
                                      <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={isFirstAssistantMessage ? "Tell us about your business..." : "Write a message..."}
                                        className="w-full px-5 py-4 pr-12 bg-[#222222] text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none min-h-[50px] max-h-[120px] overflow-y-auto border border-neutral-700"
                                        rows={1}
                                        onInput={(e) => {
                                          const target = e.target as HTMLTextAreaElement;
                                          target.style.height = 'auto';
                                          target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                                        }}
                                        disabled={isLoading}
                                      />
                                      <button 
                                        type="submit" 
                                        className={`absolute right-3 bottom-3 ${
                                          isLoading || !inputValue.trim()
                                            ? 'text-gray-500 cursor-not-allowed' 
                                            : 'text-gray-300 hover:text-white'
                                        } p-1 rounded-full transition-colors`}
                                        disabled={isLoading || !inputValue.trim()}
                                      >
                                        <SendHorizontalIcon className="w-6 h-6" />
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {isLoading && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">A</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Invisible element for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
} 