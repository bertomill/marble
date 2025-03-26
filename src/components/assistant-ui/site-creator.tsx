"use client";

import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { FC, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  CheckIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Message, BusinessInfo } from "@/types/chat";

interface SiteCreatorProps {
  initialMessages?: Message[];
}

export const SiteCreator: FC<SiteCreatorProps> = ({ initialMessages = [] }) => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: "1",
            type: "assistant",
            content:
              "Hi there! I'll help you create your SiteStack website. Let's start with some basic information about your business.",
          },
        ]
  );
  const [isTyping, setIsTyping] = useState(false);
  const [showProgressSteps, setShowProgressSteps] = useState(false);
  const [progressSteps, setProgressSteps] = useState([
    { id: 1, text: "Preparing dashboard for SiteStack", status: "waiting" },
    { id: 2, text: "Installing apps based on your goals", status: "waiting" },
    { id: 3, text: "Generating custom services", status: "waiting" },
    { id: 4, text: "Creating your personalized setup", status: "waiting" },
  ]);

  // Business info state to save
  const [businessInfo, setBusinessInfo] = useState<Partial<BusinessInfo>>({
    name: "",
    industry: "",
    description: "",
    targetAudience: "",
    competitors: "",
    goals: [],
    features: [],
    autoDiscover: true,
  });

  // Use the proper chat runtime from the SDK
  const chatRuntime = useChatRuntime({
    api: "/api/chat",
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to simulate assistant typing
  const simulateTyping = (delay: number = 500) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        resolve();
      }, delay);
    });
  };

  // Function to add a new message
  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  // Function to handle user input submission
  const handleSubmit = async (input: string) => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    addMessage(userMessage);

    // Wait for typing animation
    setIsTyping(true);

    try {
      // Use the chatRuntime to send message to OpenAI
      const response = await chatRuntime.sendMessage({
        message: input,
        data: { userInfo: businessInfo },
      });

      setIsTyping(false);

      // Check for information to extract - simple detection of key-value pairs
      const contentText = response.content || "";
      const detectedInfo = extractBusinessInfo(contentText, input);
      
      if (Object.keys(detectedInfo).length > 0) {
        // Update business info with any detected information
        setBusinessInfo((prev) => ({
          ...prev,
          ...detectedInfo,
        }));
      }

      // Add the AI message response
      addMessage({
        id: Date.now().toString(),
        type: "assistant",
        content: contentText,
        // Simple detection of options in bullet points or numbered lists
        options: extractOptions(contentText),
      });

      // If we have enough information, prompt to finish
      if (
        businessInfo.name &&
        businessInfo.industry &&
        businessInfo.description &&
        businessInfo.targetAudience
      ) {
        // Check if this was already the last message suggesting to continue
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.content.includes("proceed to the next step")) {
          // If user confirmed, proceed to save and redirect
          if (input.toLowerCase().includes("yes")) {
            await finalizeOnboarding();
          }
        } else {
          // Ask if ready to proceed
          setTimeout(async () => {
            await simulateTyping(800);

            addMessage({
              id: Date.now().toString(),
              type: "assistant",
              content:
                "Thanks for providing all this information! I'm ready to help you build your website. Shall we proceed to the next step?",
              options: ["Yes, continue to analysis"],
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      setIsTyping(false);
      addMessage({
        id: Date.now().toString(),
        type: "assistant",
        content:
          "I'm having trouble processing your request. Please try again or provide more information about your business.",
      });
    }
  };

  // Helper function to extract business information from AI responses
  const extractBusinessInfo = (content: string, userInput: string): Partial<BusinessInfo> => {
    const info: Partial<BusinessInfo> = {};
    
    // If user directly stated their business name
    if (userInput.toLowerCase().includes("website for") || 
        userInput.toLowerCase().includes("my business") ||
        userInput.toLowerCase().includes("called") ||
        userInput.toLowerCase().includes("named")) {
      // Try to extract business name from user input
      const nameMatch = userInput.match(/website for (.+?)(?:\.|\n|$)/i) || 
                         userInput.match(/my business (?:is |name is |called |named )(.+?)(?:\.|\n|$)/i) ||
                         userInput.match(/called (.+?)(?:\.|\n|$)/i) ||
                         userInput.match(/named (.+?)(?:\.|\n|$)/i);
      
      if (nameMatch && nameMatch[1]) {
        info.name = nameMatch[1].trim();
      }
    }
    
    // Check for industry mentions
    if (userInput.toLowerCase().includes("jewelry") || content.toLowerCase().includes("jewelry")) {
      info.industry = "Jewelry";
    }
    
    return info;
  };
  
  // Helper function to extract options from AI response
  const extractOptions = (content: string): string[] => {
    const options: string[] = [];
    const optionsMatch = content.match(/(\d+\.\s.+|\*\s.+|\-\s.+)/g);
    
    if (optionsMatch && optionsMatch.length > 0) {
      optionsMatch.forEach(option => {
        const cleanOption = option.replace(/^\d+\.\s|\*\s|\-\s/, '').trim();
        if (cleanOption) options.push(cleanOption);
      });
    }
    
    return options;
  };

  // Function to finalize the onboarding process
  const finalizeOnboarding = async () => {
    try {
      // Save business info to session storage
      sessionStorage.setItem("businessInfo", JSON.stringify(businessInfo));
      console.log("Business info saved to session storage:", businessInfo);

      // Final message before showing progress
      addMessage({
        id: Date.now().toString(),
        type: "assistant",
        content: "Great! I'll start preparing your website now...",
      });

      // Show progress steps after a short delay
      setTimeout(() => {
        setShowProgressSteps(true);

        // Update progress steps one by one
        updateProgressStep(0, "active");

        setTimeout(() => {
          updateProgressStep(0, "completed");
          updateProgressStep(1, "active");

          setTimeout(() => {
            updateProgressStep(1, "completed");
            updateProgressStep(2, "active");

            setTimeout(() => {
              updateProgressStep(2, "completed");
              updateProgressStep(3, "active");

              setTimeout(() => {
                updateProgressStep(3, "completed");

                // Redirect after all steps are complete
                setTimeout(() => {
                  router.push("/analysis");
                }, 800);
              }, 800);
            }, 800);
          }, 1500);
        }, 1000);
      }, 1000);
    } catch (error) {
      console.error("Error finalizing onboarding:", error);

      addMessage({
        id: Date.now().toString(),
        type: "assistant",
        content: "There was an error saving your information. Please try again.",
      });
    }
  };

  // Function to update a progress step status
  const updateProgressStep = (
    index: number,
    status: "waiting" | "active" | "completed"
  ) => {
    setProgressSteps((steps) =>
      steps.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  // Start the conversation automatically on first load
  useEffect(() => {
    if (messages.length === 1) {
      setTimeout(async () => {
        await simulateTyping(800);
        
        // Use the chatRuntime to get the first message
        try {
          const response = await chatRuntime.sendMessage({
            message: "I need help creating a website",
            data: { userInfo: businessInfo },
          });
          
          setIsTyping(false);
          
          addMessage({
            id: Date.now().toString(),
            type: "assistant",
            content: response.content || "Could you tell me the name of your business?",
            options: extractOptions(response.content || ""),
          });
        } catch (error) {
          console.error("Error starting conversation:", error);
          setIsTyping(false);
          addMessage({
            id: Date.now().toString(),
            type: "assistant",
            content: "Could you tell me the name of your business?",
          });
        }
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showProgressSteps) {
    return (
      <div className="bg-background rounded-lg shadow-lg overflow-hidden border p-8 w-full max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-8 text-center">Setting up your SiteStack website</h2>
        
        <div className="space-y-6">
          {progressSteps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 
                ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                  step.status === 'active' ? 'bg-primary text-white' : 
                  'bg-muted text-muted-foreground'}`}
              >
                {step.status === 'completed' ? (
                  <CheckIcon className="h-5 w-5" />
                ) : step.status === 'active' ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />
                ) : (
                  <span className="text-sm">{step.id}</span>
                )}
              </div>
              <span className={`text-base ${
                step.status === 'completed' ? 'text-green-500' : 
                step.status === 'active' ? 'text-primary' : 
                'text-muted-foreground'
              }`}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider runtime={chatRuntime}>
      <div className="w-full max-w-2xl mx-auto">
        <ThreadPrimitive.Root
          className="bg-background box-border flex h-[540px] flex-col overflow-hidden rounded-lg border"
        >
          <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
            {messages.map((message) => (
              <MessageComponent 
                key={message.id} 
                message={message} 
                options={message.options}
                onOptionClick={handleSubmit} 
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="w-full max-w-[42rem] py-4">
                <div className="flex items-start">
                  <div className="flex max-w-[80%] flex-col">
                    <div className="break-words rounded-xl bg-neutral-200 p-4">
                      <div className="flex space-x-1 items-center">
                        <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            
            <div className="sticky bottom-0 mt-3 flex w-full max-w-[42rem] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
              <ThreadScrollToBottom />
              <CustomComposer onSubmit={handleSubmit} />
            </div>
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const CustomComposer: FC<{ onSubmit: (input: string) => Promise<void> }> = ({ onSubmit }) => {
  const [input, setInput] = useState("");

  const handleSubmit = async () => {
    if (input.trim()) {
      const currentInput = input;
      setInput("");
      await onSubmit(currentInput);
    }
  };

  return (
    <div className="focus-within:border-ring/20 flex w-full flex-wrap items-end rounded-lg border bg-inherit px-2.5 shadow-sm transition-colors ease-in">
      <textarea
        rows={1}
        autoFocus
        placeholder="Write a message..."
        className="placeholder:text-neutral-500 max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <TooltipIconButton
        tooltip="Send"
        variant="default"
        className="my-2.5 size-8 p-2 transition-opacity ease-in"
        onClick={handleSubmit}
      >
        <SendHorizontalIcon />
      </TooltipIconButton>
    </div>
  );
};

interface MessageComponentProps {
  message: Message;
  options?: string[];
  onOptionClick: (option: string) => Promise<void>;
}

const MessageComponent: FC<MessageComponentProps> = ({ message, options, onOptionClick }) => {
  const isAssistant = message.type === "assistant";

  const handleOptionClick = async (option: string) => {
    await onOptionClick(option);
  };

  return (
    <div className="w-full max-w-[42rem] py-4">
      <div className={`flex items-start ${isAssistant ? "" : "justify-end"}`}>
        <div className={`flex max-w-[80%] flex-col ${isAssistant ? "" : "items-end"}`}>
          <div className={`break-words rounded-xl ${isAssistant ? "bg-neutral-200 text-neutral-800" : "bg-primary text-primary-foreground"} p-4`}>
            {message.content}
          </div>

          {/* Options buttons */}
          {isAssistant && options && options.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option)}
                  className="px-3 py-1 text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-full transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 