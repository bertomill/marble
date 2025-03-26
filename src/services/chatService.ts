// Chat service for OpenAI API integration
import { Message } from '../types/chat';

// Use the backend URL from environment variables, or default to local API routes if not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Chat with the OpenAI assistant to get insights about the user's website needs
 * This provides a more conversational approach to gathering user requirements
 */
export const chatService = {
  /**
   * Send a message to the OpenAI API and get a response
   * @param messages Previous messages in the conversation for context
   * @param userInfo Any existing user information to provide context
   */
  sendMessage: async (messages: Message[], userInfo: any = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          userInfo
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP error! Status: ${response.status}`
        }));
        throw new Error(error.error || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  },

  /**
   * Analyze user input to determine next appropriate question
   * @param conversation The full conversation history
   * @param currentInfo Current business information collected
   */
  getNextQuestion: async (conversation: Message[], currentInfo: any) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation,
          currentInfo
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP error! Status: ${response.status}`
        }));
        throw new Error(error.error || `HTTP error! Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting next question:', error);
      throw error;
    }
  }
};

export default chatService; 