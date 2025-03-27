import { Timestamp } from 'firebase/firestore';

// Define the main interface for screenshots
export interface Screenshot {
  id: string;
  altText?: string;
  captureDate?: string;
  category?: string[];
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  description?: string;
  fileName?: string;
  imageUrl: string;
  platform?: string;
  referenceNumber?: string;
  siteName?: string;
  tags?: string[];
  title?: string;
  type?: string;
  url?: string;
}

// Constants for screenshot related data
export const SCREENSHOT_PLATFORMS = ['Web', 'Mobile', 'Tablet', 'Desktop', 'Other'];

export const SCREENSHOT_CATEGORIES = [
  'E-commerce',
  'SaaS',
  'Portfolio',
  'Blog',
  'Social Media',
  'Fintech',
  'Healthcare',
  'Education',
  'Travel',
  'Entertainment',
  'Food & Drink',
  'Real Estate',
  'Transportation',
  'News & Media',
  'Government',
  'Nonprofit',
  'Technology',
  'Sports',
  'Fashion',
  'Art & Design',
  'Business',
  'Marketing',
  'Productivity',
  'Gaming',
  'Other'
]; 