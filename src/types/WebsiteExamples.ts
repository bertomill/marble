// Define the main interface for website examples
export interface WebsiteExample {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string[];
  type: 'App' | 'Screen' | 'Marketing Page' | 'UI Element' | 'Flow';
  tags: string[];
  screenshots: Screenshot[];
  createdAt: number;
  updatedAt: number;
}

// Interface for individual screenshots with component annotations
export interface Screenshot {
  id: string;
  imageUrl: string;
  altText: string;
  components: ComponentAnnotation[];
  description: string;
}

// Interface for component annotations
export interface ComponentAnnotation {
  id: string;
  name: string;
  description: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tags: string[];
  componentType: string;
}

// Categories for filtering
export const WEBSITE_CATEGORIES = [
  "Business", 
  "Finance", 
  "CRM", 
  "Shopping", 
  "AI", 
  "Education", 
  "Food & Drink", 
  "Productivity", 
  "Health & Fitness", 
  "Crypto & Web3", 
  "Entertainment",
  "Design",
  "Social Media"
];

// Component types for annotations
export const COMPONENT_TYPES = [
  "Navigation",
  "Hero Section",
  "Card",
  "Form",
  "Button",
  "Search Bar",
  "Filter",
  "Modal",
  "Dropdown",
  "Carousel",
  "Gallery",
  "Testimonial",
  "Pricing Table",
  "Footer",
  "Header",
  "Menu",
  "Tab",
  "Accordion",
  "Pagination",
  "Chart",
  "Avatar",
  "Icon",
  "Badge",
  "Alert",
  "Toast"
]; 