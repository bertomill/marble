// Define types for chat-related functionality

/**
 * Represents a message in the chat conversation
 */
export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  options?: string[];
}

/**
 * Business information collected during onboarding
 */
export interface BusinessInfo {
  name: string;
  industry: string;
  description: string;
  targetAudience: string;
  competitors: string;
  goals: string[];
  features: string[];
  autoDiscover: boolean;
  websiteType?: string;
  budget?: string;
  timeline?: string;
  additionalNotes?: string;
}

/**
 * Response from the OpenAI API
 */
export interface ChatResponse {
  message: string;
  options?: string[];
  nextStep?: number;
  suggestedInfo?: Partial<BusinessInfo>;
} 