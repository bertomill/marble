'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckIcon,
  InfoIcon,
  SearchIcon,
  PaintbrushIcon,
  CheckCircleIcon,
  Edit2Icon,
  Sparkles,
  X,
  ClipboardCheck,
  FileCheck,
  PlusCircleIcon,
  Globe,
  Search,
  ImageIcon,
  MousePointerClick,
  UserIcon,
  SparklesIcon,
  Palette,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, addDoc } from 'firebase/firestore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ClientOnly from '@/components/client-only';
import { auth } from '@/lib/firebase';

// Define window interface with attachments
declare global {
  interface Window {
    __ATTACHMENTS__: Array<{
      id: string;
      name: string;
      type: string;
      file: File;
      url?: string;
    }>;
  }
}

// Define project requirements interface
interface ProjectRequirements {
  projectDescription: string;
  projectType: string;
  targetAudience: string;
  keyFeatures: string[];
  designPreferences: string[];
  similarWebsites: WebsiteReference[];
  additionalNotes: string;
  companyWebsite?: string;
  companyDocuments?: string[];
}

// Define website reference type
interface WebsiteReference {
  title: string;
  url: string; 
  description: string;
  selected?: boolean;
  technologies?: string[];
  relevance?: string;
}

// Define API response types to match our website research endpoint
interface SearchAPIResponse {
  results: SearchResult[];
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  technologies?: string[];
  relevance?: string;
}

// Define interface for screenshot data
interface DesignScreenshot {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  style?: string;
  colors?: string[];
  source?: string;
  selected?: boolean;
}

// Define review section interface
interface ReviewSection {
  reviewNotes: string;
  approvedRequirements: boolean;
  approvedDesign: boolean;
  finalFeedback: string;
}

// Design document interface for AI-generated content
interface DesignDocument {
  businessDescription: string;
  folderStructure: string;
  techStack: string[];
  database: {
    tables: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        description: string;
      }>
    }>
  };
  sampleImages: string[];
  recommendations: string[];
  status: 'generating' | 'ready' | 'error';
  downloadUrl?: string;
}

// Custom components for the create page
export default function CreateProject() {
  // Initialize router
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('info');
  const [infoComplete, setInfoComplete] = useState(false);
  const [researchComplete, setResearchComplete] = useState(false);
  
  // Store previous values to track changes
  const prevRequirementsRef = useRef<ProjectRequirements>({
    projectDescription: '',
    projectType: '',
    targetAudience: '',
    keyFeatures: [],
    designPreferences: [],
    similarWebsites: [],
    additionalNotes: ''
  });
  
  const [projectRequirements, setProjectRequirements] = useState<ProjectRequirements>({
    projectDescription: '',
    projectType: '',
    targetAudience: '',
    keyFeatures: [],
    designPreferences: [],
    similarWebsites: [],
    additionalNotes: ''
  });

  // Track project requirement fields that have been reviewed
  const [reviewedFields, setReviewedFields] = useState({
    projectDescription: false,
    projectType: false,
    targetAudience: false,
    keyFeatures: false,
    designPreferences: false
  });
  
  // State to track web research progress
  const [isResearching, setIsResearching] = useState(false);
  
  // Add ref for research section
  const researchSectionRef = useRef<HTMLDivElement>(null);

  // Add design-related state
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [designScreenshots, setDesignScreenshots] = useState<DesignScreenshot[]>([]);
  const [groupedScreenshots, setGroupedScreenshots] = useState<Record<string, DesignScreenshot[]>>({});
  const [selectedLayout, setSelectedLayout] = useState<string>('all');
  const [designComplete, setDesignComplete] = useState(false);
  
  // Add review-related state
  const [reviewData, setReviewData] = useState<ReviewSection>({
    reviewNotes: '',
    approvedRequirements: false,
    approvedDesign: false,
    finalFeedback: ''
  });
  const [reviewComplete, setReviewComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Design Document state
  const [designDocument, setDesignDocument] = useState<DesignDocument | null>(null);

  // Add ref for the review section
  const reviewSectionRef = useRef<HTMLDivElement>(null);

  // Initialize attachments state
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    type: string;
    file: File;
    url?: string;
  }>>([]);
  
  // Initialize window.__ATTACHMENTS__ on client side only
  useEffect(() => {
    // Initialize attachments if they don't exist
    if (typeof window !== 'undefined') {
      if (!window.__ATTACHMENTS__) {
        window.__ATTACHMENTS__ = [];
      }
      
      // Set initial attachments from window
      setAttachments(window.__ATTACHMENTS__);
      
      // Add event listener for attachment updates
      const handleAttachmentUpdate = () => {
        setAttachments([...window.__ATTACHMENTS__]);
      };
      
      window.addEventListener('attachment-updated', handleAttachmentUpdate);
      
      return () => {
        window.removeEventListener('attachment-updated', handleAttachmentUpdate);
      };
    }
  }, []);

  // Function to scroll to research section
  const scrollToResearch = () => {
    if (researchSectionRef.current) {
      researchSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add visual feedback when fields are updated
  const [lastUpdatedField, setLastUpdatedField] = useState<string | null>(null);
  const [designInput, setDesignInput] = useState('');
  const [showCompleteNotification, setShowCompleteNotification] = useState(false);

  // Track changes to project requirements to provide visual feedback
  useEffect(() => {
    // Store which fields were updated
    const updatedFields: string[] = [];
    
    // Compare current values with previous values
    if (projectRequirements.projectType !== prevRequirementsRef.current.projectType 
        && projectRequirements.projectType !== '') {
      updatedFields.push('projectType');
    }
    
    if (projectRequirements.projectDescription !== prevRequirementsRef.current.projectDescription 
        && projectRequirements.projectDescription !== '') {
      updatedFields.push('projectDescription');
    }
    
    if (projectRequirements.targetAudience !== prevRequirementsRef.current.targetAudience 
        && projectRequirements.targetAudience !== '') {
      updatedFields.push('targetAudience');
    }
    
    if (projectRequirements.keyFeatures.length !== prevRequirementsRef.current.keyFeatures.length 
        && projectRequirements.keyFeatures.length > 0) {
      updatedFields.push('keyFeatures');
    }
    
    if (projectRequirements.designPreferences.length !== prevRequirementsRef.current.designPreferences.length 
        && projectRequirements.designPreferences.length > 0) {
      updatedFields.push('designPreferences');
    }
    
    // If any fields were updated, set the last updated field
    if (updatedFields.length > 0) {
      setLastUpdatedField(updatedFields[updatedFields.length - 1]);
      setTimeout(() => {
        setLastUpdatedField(null);
      }, 3000);
    }
    
    // Update the previous values ref
    prevRequirementsRef.current = JSON.parse(JSON.stringify(projectRequirements));
  }, [projectRequirements]);

  // Check if all requirements are filled
  useEffect(() => {
    // Check if project type, project description, target audience, key features, and design preferences are all filled
    if (
      projectRequirements.projectType && 
      projectRequirements.projectDescription &&
      projectRequirements.targetAudience && 
      projectRequirements.keyFeatures.length > 0 && 
      projectRequirements.designPreferences.length > 0 &&
      !infoComplete && // Only show if we haven't marked the tab as complete yet
      activeTab === 'info' // Only show on the info tab
    ) {
      // Show notification after a short delay to not overwhelm the user
      const timer = setTimeout(() => {
        setShowCompleteNotification(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setShowCompleteNotification(false);
    }
  }, [projectRequirements, infoComplete, activeTab]);

  // New state for feature input
  const [featureInput, setFeatureInput] = useState('');

  // New function to add a new feature
  const addFeature = (newFeature: string) => {
    const updatedFeatures = [...projectRequirements.keyFeatures, newFeature];
    setProjectRequirements({...projectRequirements, keyFeatures: updatedFeatures});
    setLastUpdatedField('keyFeatures');
    setFeatureInput('');
  };

  // New function to add a new design preference
  const addDesignPreference = (newPreference: string) => {
    const updatedPreferences = [...projectRequirements.designPreferences, newPreference];
    setProjectRequirements({...projectRequirements, designPreferences: updatedPreferences});
    setLastUpdatedField('designPreferences');
    setDesignInput('');
  };

  // Function to fetch design recommendations
  const fetchDesignRecommendations = async () => {
    try {
      setIsLoadingDesigns(true);
      
      // Simplified approach: just get a batch of random screenshots
      const screenshotsRef = collection(db, 'screenshots');
      
      try {
        // Get a simple batch of screenshots with a reasonable limit
        const simpleQuery = query(
          screenshotsRef,
          limit(20) // Get up to 20 screenshots
        );
        
        const screenshotSnapshot = await getDocs(simpleQuery);
        
        // If we have screenshots, process them
        if (!screenshotSnapshot.empty) {
          const screenshots: DesignScreenshot[] = [];
          
          screenshotSnapshot.forEach((doc) => {
            const data = doc.data();
            screenshots.push({ 
              id: doc.id, 
              url: data.imageUrl || data.url || "",
              title: data.title || 'Screenshot',
              description: data.description || '',
              category: data.category || 'ui',
              tags: Array.isArray(data.tags) ? data.tags : [],
              selected: false
            });
          });
          
          // Update state with the fetched screenshots
          setDesignScreenshots(screenshots);
          
          // Group screenshots by category
          const grouped: Record<string, DesignScreenshot[]> = {};
          
          screenshots.forEach(screenshot => {
            // Ensure category exists as a property
            const category = screenshot.category || 'other';
            
            if (!grouped[category]) {
              grouped[category] = [];
            }
            grouped[category].push(screenshot);
          });
          
          setGroupedScreenshots(grouped);
          return; // Exit early if we have screenshots
        } else {
          // No screenshots found, will fall through to fallback
          console.log('No screenshots found in Firebase');
        }
      } catch (error) {
        console.error('Error fetching screenshots:', error);
        // Will fall through to fallback
      }
      
      // If we get here, we need to use fallback data
      throw new Error('No screenshots found or error occurred');
      
    } catch (error) {
      console.error('Using fallback screenshots:', error);
      // Fallback to sample data in case of error
      const fallbackScreenshots = [
        {
          id: "screen1",
          url: "/screenshots/dashboard-analytics.jpg",
          title: "Analytics Dashboard",
          description: "Modern dashboard with metrics and charts",
          category: "dashboard",
          tags: ["analytics", "charts", "dashboard", "admin"],
          selected: false
        },
        {
          id: "screen2",
          url: "/screenshots/profile-minimal.jpg",
          title: "User Profile",
          description: "Clean user profile with stats",
          category: "profile",
          tags: ["profile", "user", "minimal"],
          selected: false
        },
        {
          id: "screen3",
          url: "/screenshots/landing-gradient.jpg",
          title: "Landing Hero",
          description: "Bold landing page with gradient background",
          category: "marketing",
          tags: ["landing", "hero", "gradient", "bold"],
          selected: false
        },
        {
          id: "screen4",
          url: "/screenshots/settings-dark.jpg",
          title: "Settings Panel",
          description: "Dark mode settings interface",
          category: "settings",
          tags: ["settings", "dark mode", "preferences"],
          selected: false
        },
        {
          id: "screen5",
          url: "/screenshots/auth-login.jpg",
          title: "Login Screen",
          description: "Clean authentication interface",
          category: "authentication",
          tags: ["login", "auth", "form"],
          selected: false
        },
        {
          id: "screen6",
          url: "/screenshots/mobile-app.jpg",
          title: "Mobile App UI",
          description: "Modern mobile application interface",
          category: "mobile",
          tags: ["mobile", "app", "ui"],
          selected: false
        },
        {
          id: "screen7",
          url: "/screenshots/data-table.jpg",
          title: "Data Table",
          description: "Interactive data table with sorting",
          category: "tables",
          tags: ["data", "table", "grid"],
          selected: false
        },
        {
          id: "screen8",
          url: "/screenshots/checkout-form.jpg",
          title: "Checkout Form",
          description: "E-commerce checkout flow",
          category: "e-commerce",
          tags: ["checkout", "form", "payment"],
          selected: false
        }
      ];
      
      setDesignScreenshots(fallbackScreenshots);
      
      // Group fallback screenshots by category
      const fallbackGrouped: Record<string, DesignScreenshot[]> = {};
      
      fallbackScreenshots.forEach(screenshot => {
        const category = screenshot.category;
        if (!fallbackGrouped[category]) {
          fallbackGrouped[category] = [];
        }
        fallbackGrouped[category].push(screenshot);
      });
      
      setGroupedScreenshots(fallbackGrouped);
    } finally {
      setIsLoadingDesigns(false);
    }
  };
  
  // Load design recommendations when switching to design tab
  useEffect(() => {
    if (activeTab === 'design' && designScreenshots.length === 0 && !isLoadingDesigns) {
      fetchDesignRecommendations();
    }
  }, [activeTab, designScreenshots.length, isLoadingDesigns]);

  // Function to generate AI design document
  const generateDesignDocument = async () => {
    try {
      // Initialize the document with generating status
      setDesignDocument({
        businessDescription: '',
        folderStructure: '',
        techStack: [],
        database: {
          tables: []
        },
        sampleImages: [],
        recommendations: [],
        status: 'generating'
      });
      
      // In a real implementation, this would call an API endpoint to get AI-generated content
      // For demo purposes, we'll simulate the API call with a timeout
      setTimeout(() => {
        // Generate tech stack based on project type
        let techStack = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'];
        
        if (projectRequirements.projectType.includes('Mobile')) {
          techStack = ['React Native', 'TypeScript', 'Redux', 'Firebase'];
        } else if (projectRequirements.projectType.includes('E-commerce')) {
          techStack = ['Next.js', 'TypeScript', 'Stripe', 'MongoDB', 'Redux'];
        }
        
        // Add technology suggestions from research sites
        const techSuggestions = new Set<string>(techStack);
        projectRequirements.similarWebsites.forEach(site => {
          if (site.technologies && Array.isArray(site.technologies)) {
            site.technologies.forEach(tech => {
              techSuggestions.add(tech);
            });
          }
        });
        
        // Generate database structure based on features
        const tables = [
          {
            name: 'users',
            fields: [
              { name: 'id', type: 'uuid', description: 'Primary key' },
              { name: 'email', type: 'string', description: 'User email address' },
              { name: 'name', type: 'string', description: 'User full name' },
              { name: 'created_at', type: 'timestamp', description: 'Account creation timestamp' }
            ]
          }
        ];
        
        if (projectRequirements.keyFeatures.some(f => 
          f.toLowerCase().includes('authentication') || 
          f.toLowerCase().includes('login') || 
          f.toLowerCase().includes('user')
        )) {
          tables.push({
            name: 'auth',
            fields: [
              { name: 'id', type: 'uuid', description: 'Primary key' },
              { name: 'user_id', type: 'uuid', description: 'Foreign key to users table' },
              { name: 'access_token', type: 'string', description: 'JWT token' },
              { name: 'expires_at', type: 'timestamp', description: 'Token expiration time' }
            ]
          });
        }
        
        if (projectRequirements.keyFeatures.some(f => 
          f.toLowerCase().includes('profile') || 
          f.toLowerCase().includes('settings')
        )) {
          tables.push({
            name: 'profiles',
            fields: [
              { name: 'id', type: 'uuid', description: 'Primary key' },
              { name: 'user_id', type: 'uuid', description: 'Foreign key to users table' },
              { name: 'bio', type: 'text', description: 'User bio or description' },
              { name: 'preferences', type: 'jsonb', description: 'User settings and preferences' },
              { name: 'avatar_url', type: 'string', description: 'Profile picture URL' }
            ]
          });
        }
        
        // Get URLs of selected design screenshots
        const sampleImages = designScreenshots
          .filter((s: DesignScreenshot) => s.selected)
          .map((screenshot: DesignScreenshot) => screenshot.url);
        
        // Create document content
        const document: DesignDocument = {
          businessDescription: `${projectRequirements.projectType} for ${projectRequirements.targetAudience}. ${projectRequirements.projectDescription}`,
          folderStructure: 
`/src
  /app
    /api - Backend API routes
    /components - Reusable UI components
      /ui - Base components
      /features - Domain-specific components
    /pages - Application pages
    /hooks - Custom React hooks
  /lib
    /utils - Utility functions
    /db - Database models
  /styles - Global CSS styles
  /public - Static assets
  /tests - Unit and integration tests`,
          techStack: Array.from(techSuggestions),
          database: {
            tables
          },
          sampleImages,
          recommendations: [
            `Consider implementing a CI/CD pipeline using GitHub Actions for automated testing and deployment.`,
            `Use Storybook to document and test UI components in isolation.`,
            `Implement error monitoring using Sentry to catch and diagnose issues in production.`,
            `Use feature flags for controlled rollout of new functionality.`,
            `Create a robust testing strategy with Jest for unit tests and Cypress for E2E tests.`
          ],
          status: 'ready',
          // In a real implementation, this would be a URL to download the document
          // For demo, we'll create a data URL for a simple JSON file
          downloadUrl: `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify({
              projectName: projectRequirements.projectType,
              projectDescription: projectRequirements.projectDescription,
              targetAudience: projectRequirements.targetAudience,
              keyFeatures: projectRequirements.keyFeatures,
              designPreferences: projectRequirements.designPreferences,
              techStack: Array.from(techSuggestions),
              folderStructure: `/src
  /app
    /api - Backend API routes
    /components - Reusable UI components
    /pages - Application pages
  /styles - Global CSS styles
  /public - Static assets`,
              database: {
                tables
              },
              recommendations: [
                `Consider implementing a CI/CD pipeline for automated testing and deployment.`,
                `Use Storybook to document and test UI components in isolation.`,
                `Implement error monitoring to catch and diagnose issues in production.`
              ]
            }, null, 2)
          )}`
        };
        
        setDesignDocument(document);
      }, 3000); // Simulate 3 second API call
      
    } catch (error) {
      console.error('Error generating design document:', error);
      setDesignDocument({
        businessDescription: '',
        folderStructure: '',
        techStack: [],
        database: { tables: [] },
        sampleImages: [],
        recommendations: [],
        status: 'error'
      });
    }
  };

  // Add download state
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Function to generate and download a zip file containing all project data
  const generateAndDownloadZip = async (projectRequirements: ProjectRequirements, designDocument: DesignDocument, selectedScreenshots: DesignScreenshot[]) => {
    // Set download state
    setIsDownloading(true);
    
    try {
      // Create a new zip instance
      const zip = new JSZip();
      
      // Create a folder structure inside the zip
      const documentFolder = zip.folder("project-document") as JSZip;
      const imagesFolder = zip.folder("design-images") as JSZip;
      const databaseFolder = zip.folder("database-structure") as JSZip;
      
      // Add the JSON document with project details
      documentFolder.file("project-details.json", JSON.stringify({
        projectName: projectRequirements.projectType,
        projectDescription: projectRequirements.projectDescription,
        targetAudience: projectRequirements.targetAudience,
        keyFeatures: projectRequirements.keyFeatures,
        designPreferences: projectRequirements.designPreferences,
        techStack: designDocument.techStack,
        folderStructure: designDocument.folderStructure,
        recommendations: designDocument.recommendations
      }, null, 2));
      
      // Add README file
      documentFolder.file("README.md", `# ${projectRequirements.projectType} Project

## Project Overview
${projectRequirements.projectDescription}

## Target Audience
${projectRequirements.targetAudience}

## Key Features
${projectRequirements.keyFeatures.map(feature => `- ${feature}`).join('\n')}

## Design Preferences
${projectRequirements.designPreferences.map(pref => `- ${pref}`).join('\n')}

## Technology Stack
${designDocument.techStack.map(tech => `- ${tech}`).join('\n')}

## Folder Structure
\`\`\`
${designDocument.folderStructure}
\`\`\`

## Recommendations
${designDocument.recommendations.map(rec => `- ${rec}`).join('\n')}

## Note About Design Images
The design images included in this package may be placeholder images if the original images couldn't be downloaded due to cross-origin resource sharing (CORS) restrictions. In such cases, the placeholder images contain the information about the original design references, including title, category, tags, and the original URL.

You can visit the original URLs in your browser to view the actual design references.
`);
      
      // Add database structure documentation
      if (designDocument.database && designDocument.database.tables) {
        databaseFolder.file("database-schema.json", JSON.stringify(designDocument.database, null, 2));
        
        // Create a markdown documentation of the database schema
        let dbMarkdown = `# Database Schema\n\n`;
        designDocument.database.tables.forEach(table => {
          dbMarkdown += `## Table: ${table.name}\n\n`;
          dbMarkdown += `| Field | Type | Description |\n`;
          dbMarkdown += `|-------|------|-------------|\n`;
          
          table.fields.forEach(field => {
            dbMarkdown += `| ${field.name} | ${field.type} | ${field.description} |\n`;
          });
          
          dbMarkdown += `\n`;
        });
        
        databaseFolder.file("database-schema.md", dbMarkdown);
      }
      
      // Add selected design images
      const downloadPromises = selectedScreenshots.map(async (screenshot, index) => {
        try {
          // Fetch the image
          let imageBlob;
          
          try {
            // Try to fetch the remote image - might fail due to CORS
            const response = await fetch(screenshot.url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${screenshot.url}`);
            imageBlob = await response.blob();
          } catch (fetchError) {
            console.warn('CORS issue or network error when fetching image:', fetchError);
            
            // Create a placeholder canvas with the screenshot info as text
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Fill background
              ctx.fillStyle = '#f5f5f5';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Add border
              ctx.strokeStyle = '#cccccc';
              ctx.lineWidth = 2;
              ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
              
              // Add text
              ctx.fillStyle = '#333333';
              ctx.font = 'bold 20px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`${screenshot.title}`, canvas.width / 2, 80);
              
              ctx.font = '16px Arial';
              ctx.fillText(`Category: ${screenshot.category}`, canvas.width / 2, 120);
              
              // Add tags
              if (screenshot.tags && screenshot.tags.length > 0) {
                ctx.fillText('Tags:', canvas.width / 2, 160);
                let yPos = 190;
                screenshot.tags.slice(0, 3).forEach(tag => {
                  ctx.fillText(tag, canvas.width / 2, yPos);
                  yPos += 25;
                });
              }
              
              // Add image URL reference
              ctx.font = '12px Arial';
              ctx.fillText('Original URL:', canvas.width / 2, 250);
              ctx.fillText(screenshot.url.substring(0, 40) + '...', canvas.width / 2, 270);
            }
            
            // Convert canvas to blob
            imageBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(blob => {
                resolve(blob || new Blob(['Image placeholder'], { type: 'text/plain' }));
              }, 'image/png');
            });
          }
          
          // Determine file extension from URL or default to .jpg
          const extensionMatch = screenshot.url.match(/\.(jpg|jpeg|png|gif)$/i);
          const fileExtension = extensionMatch ? extensionMatch[0] : '.png';
          
          // Create a filename
          const fileName = `${screenshot.category}-${index}${fileExtension}`;
          
          // Add to zip
          imagesFolder.file(fileName, imageBlob);
          
          // Add image reference to the project document
          return {
            filename: fileName,
            title: screenshot.title,
            category: screenshot.category,
            description: screenshot.description,
            original_url: screenshot.url
          };
        } catch (error) {
          console.error('Failed to add image to zip:', error);
          return null;
        }
      });
      
      // Wait for all image downloads to complete
      const imageReferences = await Promise.all(downloadPromises);
      
      // Add image catalog with references
      documentFolder.file("image-catalog.json", JSON.stringify(
        imageReferences.filter(ref => ref !== null), 
        null, 
        2
      ));
      
      // Generate the zip file and trigger download
      const zipContent = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
        comment: `${projectRequirements.projectType} Project Package`
      });
      
      // Create a filename based on the project type
      const fileName = `${projectRequirements.projectType.replace(/\s+/g, '-').toLowerCase()}-project-package.zip`;
      
      // Download the zip file
      saveAs(zipContent, fileName);
      
      // Reset the download state after a delay
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    } catch (error) {
      console.error('Error generating zip file:', error);
      setIsDownloading(false);
      
      // Display an error message to the user (you could implement a toast notification here)
      alert('Failed to generate the zip file. Please try again.');
    }
  };

  // Save project to Firestore
  const saveProjectToFirestore = async () => {
    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a project');
      }
      
      // Create a project entry with null checks for undefined values
      const projectData = {
        name: projectRequirements.projectType || 'New Project',
        description: projectRequirements.projectDescription || '',
        type: projectRequirements.projectType || '',
        targetAudience: projectRequirements.targetAudience || '',
        keyFeatures: projectRequirements.keyFeatures || [],
        designPreferences: projectRequirements.designPreferences || [],
        similarWebsites: projectRequirements.similarWebsites || [],
        additionalNotes: projectRequirements.additionalNotes || '',
        // Handle potentially undefined fields by providing empty defaults
        companyWebsite: projectRequirements.companyWebsite || '',
        companyDocuments: projectRequirements.companyDocuments || [],
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Store user ID to apply permissions
        uid: user.uid,
        userEmail: user.email || '',
        // Filter out undefined values from nested objects
        designDocument: designDocument ? {
          businessDescription: designDocument.businessDescription || '',
          folderStructure: designDocument.folderStructure || '',
          techStack: designDocument.techStack || [],
          database: designDocument.database || { tables: [] },
          sampleImages: designDocument.sampleImages || [],
          recommendations: designDocument.recommendations || [],
          status: designDocument.status || 'ready'
        } : null,
        selectedScreenshots: designScreenshots
          .filter((s: DesignScreenshot) => s.selected)
          .map((screenshot: DesignScreenshot) => ({
            id: screenshot.id || '',
            url: screenshot.url || '',
            title: screenshot.title || '',
            description: screenshot.description || '',
            category: screenshot.category || '',
            tags: screenshot.tags || []
          }))
      };
      
      // Add project to Firestore
      const projectRef = await addDoc(collection(db, 'projects'), projectData);
      console.log('Project saved with ID:', projectRef.id);
      
      return projectRef.id;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Main content with bottom margin for scrolling */}
      <div className="flex flex-col flex-1 overflow-auto pt-4">
        <div className="max-w-[80rem] mx-auto w-full px-4 mb-24">
          <h1 className="text-2xl font-bold mb-6">Create New Project</h1>
          
          {/* Company Resources Section - Client-side only rendering */}
          <ClientOnly>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Company Resources</CardTitle>
                <CardDescription>
                  Add links to your existing website or upload company documents to help us understand your business better
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://yourcompany.com" 
                      className="bg-muted/60 text-foreground"
                      value={projectRequirements.companyWebsite}
                      onChange={(e) => {
                        setProjectRequirements({
                          ...projectRequirements,
                          companyWebsite: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Documents</label>
                  <div className="border-2 border-dashed rounded-md p-6 text-center bg-muted/30 relative">
                    <div className="flex flex-col items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M12 18v-6"></path>
                        <path d="m9 15 3 3 3-3"></path>
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or <span className="text-primary">browse</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upload company documents, brand guidelines, or any other relevant files (PDF, DOC, JPG)
                      </p>
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          // Handle file upload
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            // Add to global attachments
                            const newAttachment = {
                              id: Date.now().toString(),
                              name: file.name,
                              type: file.type,
                              file: file,
                              url: URL.createObjectURL(file)
                            };
                            
                            // Update global attachments
                            window.__ATTACHMENTS__ = [...window.__ATTACHMENTS__, newAttachment];
                            
                            // Update project requirements
                            setProjectRequirements({
                              ...projectRequirements,
                              companyDocuments: [...(projectRequirements.companyDocuments || []), file.name]
                            });
                            
                            // Trigger attachment update event
                            window.dispatchEvent(new Event('attachment-updated'));
                          }
                        }}
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                  
                  {/* Display uploaded files */}
                  {attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-md">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                              <span className="text-sm truncate max-w-[200px]">{attachment.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => {
                                // Remove file from attachments
                                window.__ATTACHMENTS__ = window.__ATTACHMENTS__.filter(
                                  (a) => a.id !== attachment.id
                                );
                                
                                // Update project requirements
                                setProjectRequirements({
                                  ...projectRequirements,
                                  companyDocuments: projectRequirements.companyDocuments?.filter(
                                    (name) => name !== attachment.name
                                  ) || []
                                });
                                
                                // Trigger attachment update event
                                window.dispatchEvent(new Event('attachment-updated'));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </ClientOnly>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            if (value === 'review') {
              scrollToTop();
            }
          }} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-3xl mb-6">
              <TabsTrigger 
                value="info" 
                className="flex items-center gap-2"
                disabled={!infoComplete && activeTab !== 'info'}
              >
                <InfoIcon className="h-4 w-4" />
                <span>Information</span>
                {reviewedFields.projectType && 
                 reviewedFields.targetAudience && 
                 reviewedFields.keyFeatures && 
                 reviewedFields.designPreferences && (
                  <CheckCircleIcon className="h-4 w-4 ml-1 text-green-500" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="research" 
                className="flex items-center gap-2"
                disabled={!infoComplete}
              >
                <SearchIcon className="h-4 w-4" />
                <span>Research</span>
                {researchComplete && (
                  <CheckCircleIcon className="h-4 w-4 ml-1 text-green-500" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="design" 
                className="flex items-center gap-2"
                disabled={!researchComplete}
              >
                <PaintbrushIcon className="h-4 w-4" />
                <span>Design</span>
                {designComplete && (
                  <CheckCircleIcon className="h-4 w-4 ml-1 text-green-500" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="revenue" 
                className="flex items-center gap-2"
                disabled={!designComplete}
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>Review</span>
                {reviewComplete && (
                  <CheckCircleIcon className="h-4 w-4 ml-1 text-green-500" />
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Information Tab */}
            <TabsContent value="info" className="space-y-6">
              <div className="w-full">
                {/* Requirements Review Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Requirements</CardTitle>
                    <CardDescription>
                      Review and confirm your project details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Project Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Project Description</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setReviewedFields({...reviewedFields, projectDescription: !reviewedFields.projectDescription});
                            }}
                          >
                            {reviewedFields.projectDescription ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          value={projectRequirements.projectDescription}
                          onChange={(e) => setProjectRequirements({...projectRequirements, projectDescription: e.target.value})}
                          placeholder="Describe your project in a few sentences..."
                          className={`w-full min-h-[100px] p-3 rounded-md border ${reviewedFields.projectDescription ? "border-green-500" : "border-input"} 
                                  ${lastUpdatedField === 'projectDescription' ? "border-blue-500 animate-pulse" : ""} bg-muted/60 text-foreground`}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-2 top-2 h-7 text-xs bg-muted/50 hover:bg-muted flex items-center gap-1.5 px-2.5 text-muted-foreground"
                          onClick={() => {
                            // Generate project description with AI
                            const projectDescriptions = [
                              "A modern web application that helps users track their daily fitness activities and nutrition intake, with visualizations and progress tracking.",
                              "A mobile app for small business owners to manage their inventory, track sales, and analyze business performance.",
                              "An e-commerce platform specializing in handmade crafts with integrated payment processing and seller profiles.",
                              "A professional portfolio website to showcase creative work with a clean, minimal design.",
                              "A community platform for connecting local volunteers with organizations needing assistance."
                            ];
                            const suggestion = projectDescriptions[Math.floor(Math.random() * projectDescriptions.length)];
                            setProjectRequirements({...projectRequirements, projectDescription: suggestion});
                            setLastUpdatedField('projectDescription');
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          <span>Generate with AI</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Provide a brief overview of what you want to build</p>
                    </div>

                    {/* Project Type */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Project Type</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setReviewedFields({...reviewedFields, projectType: !reviewedFields.projectType});
                            }}
                          >
                            {reviewedFields.projectType ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Select 
                        value={projectRequirements.projectType} 
                        onValueChange={(value) => setProjectRequirements({...projectRequirements, projectType: value})}
                      >
                        <SelectTrigger 
                          className={`${reviewedFields.projectType ? "border-green-500" : ""} 
                                  ${lastUpdatedField === 'projectType' ? "border-blue-500 animate-pulse" : ""}`}
                        >
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Web Application">Web Application</SelectItem>
                          <SelectItem value="Mobile Application">Mobile Application</SelectItem>
                          <SelectItem value="iOS Application">iOS Application</SelectItem>
                          <SelectItem value="Android Application">Android Application</SelectItem>
                          <SelectItem value="XR Experience">XR Experience</SelectItem>
                          <SelectItem value="E-commerce Store">E-commerce Store</SelectItem>
                          <SelectItem value="Portfolio Website">Portfolio Website</SelectItem>
                          <SelectItem value="Blog/Content Site">Blog/Content Site</SelectItem>
                          <SelectItem value="Landing Page">Landing Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Target Audience</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setReviewedFields({...reviewedFields, targetAudience: !reviewedFields.targetAudience});
                            }}
                          >
                            {reviewedFields.targetAudience ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <Input 
                          value={projectRequirements.targetAudience} 
                          onChange={(e) => setProjectRequirements({...projectRequirements, targetAudience: e.target.value})}
                          placeholder="e.g., Young professionals aged 25-35 interested in fitness"
                          className={`pr-24 ${reviewedFields.targetAudience ? "border-green-500" : "border-input"} 
                                  ${lastUpdatedField === 'targetAudience' ? "border-blue-500 animate-pulse" : ""} bg-muted/60 text-foreground`}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1 h-7 text-xs bg-muted/50 hover:bg-muted flex items-center gap-1.5 px-2.5 text-muted-foreground"
                          onClick={() => {
                            // Set a demo target audience with AI
                            const aiSuggestions = [
                              "Young professionals aged 25-35 interested in fitness and wellness",
                              "Small business owners looking for productivity tools",
                              "Students and educators in higher education",
                              "Parents of young children looking for educational content",
                              "Tech enthusiasts interested in the latest innovations"
                            ];
                            const suggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
                            setProjectRequirements({...projectRequirements, targetAudience: suggestion});
                            setLastUpdatedField('targetAudience');
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          <span>Generate with AI</span>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Describe who will use your product or service</p>
                    </div>

                    {/* Key Features */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Key Features</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setReviewedFields({...reviewedFields, keyFeatures: !reviewedFields.keyFeatures});
                            }}
                          >
                            {reviewedFields.keyFeatures ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Feature input and list */}
                      <div className="space-y-2">
                        {/* Direct input field with add button */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input 
                              placeholder="Add a new feature"
                              value={featureInput}
                              onChange={(e) => setFeatureInput(e.target.value)}
                              className={`${reviewedFields.keyFeatures ? "border-green-500" : "border-input"} bg-muted/60 text-foreground`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && featureInput.trim()) {
                                  addFeature(featureInput);
                                  e.preventDefault();
                                }
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute right-1 top-1 h-7 text-xs bg-muted/50 hover:bg-muted flex items-center gap-1.5 px-2.5 text-muted-foreground"
                              onClick={() => {
                                // Generate features with AI based on project type
                                const webAppFeatures = [
                                  "User authentication and profiles",
                                  "Real-time notifications",
                                  "Interactive dashboard",
                                  "Data visualization",
                                  "Cross-device synchronization"
                                ];
                                
                                const mobileAppFeatures = [
                                  "Offline functionality",
                                  "Push notifications",
                                  "Location-based services",
                                  "Camera integration",
                                  "Social sharing"
                                ];
                                
                                let suggestions = [];
                                if (projectRequirements.projectType.includes("Web")) {
                                  suggestions = webAppFeatures;
                                } else if (projectRequirements.projectType.includes("Mobile") || 
                                          projectRequirements.projectType.includes("iOS") || 
                                          projectRequirements.projectType.includes("Android")) {
                                  suggestions = mobileAppFeatures;
                                } else {
                                  suggestions = [...webAppFeatures, ...mobileAppFeatures].slice(0, 5);
                                }
                                
                                setProjectRequirements({...projectRequirements, keyFeatures: suggestions});
                                setLastUpdatedField('keyFeatures');
                              }}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              <span>Generate with AI</span>
                            </Button>
                          </div>
                          <Button 
                            size="sm"
                            disabled={!featureInput.trim()}
                            onClick={() => addFeature(featureInput)}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {/* Features list */}
                        <div className={`p-3 border rounded-md ${lastUpdatedField === 'keyFeatures' ? "border-blue-500 animate-pulse" : ""}`}>
                          <ul className="list-disc pl-5 space-y-1">
                            {projectRequirements.keyFeatures.length > 0 ? (
                              projectRequirements.keyFeatures.map((feature, index) => (
                                <li key={index} className="text-sm flex items-center justify-between group">
                                  <span>{feature}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const newFeatures = [...projectRequirements.keyFeatures];
                                      newFeatures.splice(index, 1);
                                      setProjectRequirements({...projectRequirements, keyFeatures: newFeatures});
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-muted-foreground">No features specified yet</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">List the core functionality your project needs</p>
                    </div>

                    {/* Design Preferences */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Design Preferences</h3>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setReviewedFields({...reviewedFields, designPreferences: !reviewedFields.designPreferences});
                            }}
                          >
                            {reviewedFields.designPreferences ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Design preference input and list */}
                      <div className="space-y-2">
                        {/* Direct input field with add button */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input 
                              placeholder="Add a design preference"
                              value={designInput}
                              onChange={(e) => setDesignInput(e.target.value)}
                              className={`${reviewedFields.designPreferences ? "border-green-500" : "border-input"} bg-muted/60 text-foreground`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && designInput.trim()) {
                                  addDesignPreference(designInput);
                                  e.preventDefault();
                                }
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute right-1 top-1 h-7 text-xs bg-muted/50 hover:bg-muted flex items-center gap-1.5 px-2.5 text-muted-foreground"
                              onClick={() => {
                                // Generate design preferences with AI
                                const designStyles = [
                                  "Modern minimalist",
                                  "Dark mode/theme",
                                  "Responsive design",
                                  "Accessible interface",
                                  "Material design inspired"
                                ];
                                
                                setProjectRequirements({...projectRequirements, designPreferences: designStyles});
                                setLastUpdatedField('designPreferences');
                              }}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1" />
                              <span>Generate with AI</span>
                            </Button>
                          </div>
                          <Button 
                            size="sm"
                            disabled={!designInput.trim()}
                            onClick={() => addDesignPreference(designInput)}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {/* Design preferences list */}
                        <div className={`p-3 border rounded-md ${lastUpdatedField === 'designPreferences' ? "border-blue-500 animate-pulse" : ""}`}>
                          <ul className="list-disc pl-5 space-y-1">
                            {projectRequirements.designPreferences.length > 0 ? (
                              projectRequirements.designPreferences.map((preference, index) => (
                                <li key={index} className="text-sm flex items-center justify-between group">
                                  <span>{preference}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const newPreferences = [...projectRequirements.designPreferences];
                                      newPreferences.splice(index, 1);
                                      setProjectRequirements({...projectRequirements, designPreferences: newPreferences});
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-muted-foreground">No design preferences specified yet</li>
                            )}
                          </ul>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">Specify your visual and UI preferences</p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled={!(reviewedFields.projectDescription && 
                                  reviewedFields.projectType && 
                                  reviewedFields.targetAudience && 
                                  reviewedFields.keyFeatures && 
                                  reviewedFields.designPreferences)}
                        onClick={() => {
                          setInfoComplete(true);
                          setActiveTab('research');
                          scrollToResearch();
                        }}
                      >
                        Continue to Research
                      </Button>
                    </div>

                    {/* Notification suggesting to continue when all requirements are filled */}
                    {showCompleteNotification && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md text-sm animate-fadeIn shadow-sm">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                          <div>
                            <p className="font-medium">All requirements collected!</p>
                            <p className="text-sm mt-0.5">You can now review and proceed to the next step</p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                            onClick={() => {
                              // Mark all fields as reviewed
                              setReviewedFields({
                                projectDescription: true,
                                projectType: true,
                                targetAudience: true,
                                keyFeatures: true,
                                designPreferences: true
                              });
                              // Hide the notification
                              setShowCompleteNotification(false);
                            }}
                          >
                            Review All
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Research Tab Content */}
            <TabsContent value="research" className="mt-6">
              <div ref={researchSectionRef} className="mb-20">
                <Card>
                  <CardHeader>
                    <CardTitle>Research Similar Sites</CardTitle>
                    <CardDescription>Find inspiration from similar projects on the web</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-muted-foreground">The AI will search the web for similar websites based on your requirements.</p>
                    </div>
                    
                    {/* Show requirements summary */}
                    <div className="mb-6 p-4 bg-muted/50 rounded-md">
                      <h4 className="text-sm font-medium mb-2">Search based on these requirements:</h4>
                      <ul className="space-y-1 text-sm">
                        {projectRequirements.projectType && (
                          <li><span className="font-medium">Project Type:</span> {projectRequirements.projectType}</li>
                        )}
                        {projectRequirements.projectDescription && (
                          <li><span className="font-medium">Project Description:</span> {projectRequirements.projectDescription}</li>
                        )}
                        {projectRequirements.targetAudience && (
                          <li><span className="font-medium">Target Audience:</span> {projectRequirements.targetAudience}</li>
                        )}
                        {projectRequirements.keyFeatures.length > 0 && (
                          <li>
                            <span className="font-medium">Key Features:</span> {projectRequirements.keyFeatures.join(', ')}
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    {/* Start Search Button */}
                    {!isResearching && !researchComplete && (
                      <Button 
                        onClick={() => {
                          // Start the search process
                          setIsResearching(true);
                          
                          // Prepare a comprehensive search query based on all collected requirements
                          const constructSearchQuery = () => {
                            // Start with the project type as the base
                            let query = `best ${projectRequirements.projectType?.toLowerCase() || ''} examples`;
                            
                            // Add a few key terms from project description if available
                            if (projectRequirements.projectDescription) {
                              // Get first sentence or up to 50 chars
                              const firstSentence = projectRequirements.projectDescription.split('.')[0];
                              const shortDesc = firstSentence.length > 50 
                                ? firstSentence.substring(0, 50).trim() 
                                : firstSentence.trim();
                              
                              // Add important keywords from description
                              query += ` ${shortDesc}`;
                            }
                            
                            // Add target audience
                            if (projectRequirements.targetAudience) {
                              query += ` for ${projectRequirements.targetAudience.substring(0, 30)}`;
                            }
                            
                            // Add 1-2 key features
                            if (projectRequirements.keyFeatures && projectRequirements.keyFeatures.length > 0) {
                              const features = projectRequirements.keyFeatures.slice(0, 2).join(", ");
                              query += ` with ${features}`;
                            }
                            
                            // Ensure query isn't too long for search engines (around 200 chars max)
                            return query.substring(0, 200);
                          };
                          
                          const searchQuery = constructSearchQuery();
                          console.log("Using search query:", searchQuery);
                          
                          // Fetch real search results from our specialized API endpoint
                          fetch('/api/website-research', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              query: searchQuery,
                              projectType: projectRequirements.projectType,
                              targetAudience: projectRequirements.targetAudience,
                              keyFeatures: projectRequirements.keyFeatures,
                              designPreferences: projectRequirements.designPreferences,
                              projectDescription: projectRequirements.projectDescription
                            }),
                          })
                          .then(response => response.json())
                          .then((data: SearchAPIResponse) => {
                            // Update state with the search results from the API
                            setProjectRequirements(prev => ({
                              ...prev,
                              similarWebsites: data.results.map((site: SearchResult) => ({
                                title: site.title,
                                url: site.url,
                                description: site.snippet,
                                selected: false, // Track selection state
                                technologies: site.technologies,
                                relevance: site.relevance
                              }))
                            }));
                            
                            setResearchComplete(true);
                            setIsResearching(false);
                          })
                          .catch(error => {
                            console.error('Error fetching search results:', error);
                            
                            // Fallback to sample data in case of error
                            // Generate appropriate examples based on project type
                            let fallbackWebsites = [];
                            
                            if (projectRequirements.projectType.includes('E-commerce')) {
                              fallbackWebsites = [
                                {
                                  title: "Shopify",
                                  url: "https://www.shopify.com",
                                  description: "A comprehensive e-commerce platform with customizable templates, payment processing, and inventory management features.",
                                  selected: false,
                                  technologies: ["Ruby", "Rails", "JavaScript", "Liquid"],
                                  relevance: "High"
                                },
                                // ... other e-commerce examples ...
                              ];
                            } 
                            // ... other project types ...
                            else {
                              // Default examples
                              fallbackWebsites = [
                                {
                                  title: "Notion",
                                  url: "https://www.notion.so",
                                  description: "All-in-one workspace with clean interface, powerful features, and excellent user onboarding.",
                                  selected: false,
                                  technologies: ["JavaScript", "TypeScript", "React", "Node.js"],
                                  relevance: "Medium"
                                },
                                {
                                  title: "Figma",
                                  url: "https://www.figma.com",
                                  description: "Collaborative design tool with intuitive interface and real-time editing capabilities.",
                                  selected: false,
                                  technologies: ["JavaScript", "TypeScript", "React", "Node.js"],
                                  relevance: "High"
                                },
                                {
                                  title: "Airtable",
                                  url: "https://airtable.com",
                                  description: "Flexible database app with customizable views, automation features, and excellent mobile support.",
                                  selected: false,
                                  technologies: ["JavaScript", "TypeScript", "React", "Node.js"],
                                  relevance: "Medium"
                                }
                              ];
                            }
                            
                            setProjectRequirements(prev => ({
                              ...prev,
                              similarWebsites: fallbackWebsites
                            }));
                            
                            setResearchComplete(true);
                            setIsResearching(false);
                          });
                        }}
                        className="w-full"
                        size="lg"
                      >
                        Start Web Research
                      </Button>
                    )}
                    
                    {/* Browsing state indicator */}
                    {isResearching && (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-muted-foreground">Searching for similar websites based on your requirements...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment as we scan the web for the best examples.</p>
                      </div>
                    )}
                    
                    {/* Research Results */}
                    {researchComplete && (
                      <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-green-700 dark:text-green-300 mb-4 text-sm border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5" />
                            <p>Research complete! Select the examples that best match what you want to create.</p>
                          </div>
                        </div>
                        
                        {/* Display research results */}
                        <div className="border rounded-md p-4 bg-muted/20">
                          <h3 className="font-medium text-sm mb-2">Research Results:</h3>
                          <div className="prose prose-sm max-w-none">
                            <p>Based on the provided requirements, these websites match what you&apos;re looking for:</p>
                          </div>
                        </div>
                        
                        {projectRequirements.similarWebsites.length > 0 && (
                          <div className="grid gap-4">
                            {projectRequirements.similarWebsites.map((site, index) => (
                              <div 
                                key={index} 
                                className={`border rounded-md p-4 transition-colors cursor-pointer ${
                                  site.selected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                                }`}
                                onClick={() => {
                                  // Toggle selection state for this website
                                  setProjectRequirements(prev => {
                                    const updatedSites = [...prev.similarWebsites];
                                    updatedSites[index] = {
                                      ...updatedSites[index],
                                      selected: !updatedSites[index].selected
                                    };
                                    return {
                                      ...prev,
                                      similarWebsites: updatedSites
                                    };
                                  });
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-base flex items-center gap-2">
                                    <span className="text-lg font-semibold">
                                      {site.title || (() => {
                                        try {
                                          return new URL(site.url).hostname
                                        } catch {
                                          // If URL parsing fails, just return the URL as is
                                          return site.url
                                        }
                                      })()}
                                    </span>
                                  </h3>
                                  <div className={`h-5 w-5 flex items-center justify-center rounded-full ${
                                    site.selected ? 'bg-primary text-white' : 'border border-muted-foreground'
                                  }`}>
                                    {site.selected && <CheckIcon className="h-3 w-3" />}
                                  </div>
                                </div>
                                <a 
                                  href={site.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1.5 mt-1 text-sm"
                                  onClick={(e) => e.stopPropagation()} // Prevent the click from toggling selection
                                >
                                  Visit website 
                                  <span className="text-xs">(opens in new tab)</span>
                                </a>
                                <p className="mt-2 text-sm">{site.description}</p>
                                
                                {/* Display technology stack if available */}
                                {site.technologies && Array.isArray(site.technologies) && site.technologies.length > 0 && (
                                  <div className="mt-3">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Technologies:</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {site.technologies.map((tech: string, techIndex: number) => (
                                        <span 
                                          key={techIndex} 
                                          className="px-2 py-0.5 bg-muted text-xs rounded-full"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Display relevance if available */}
                                {site.relevance && (
                                  <div className="mt-2">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Relevance:</h4>
                                    <p className="text-xs">{site.relevance}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between mt-6">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setResearchComplete(false);
                              setIsResearching(false);
                              setProjectRequirements(prev => ({
                                ...prev,
                                similarWebsites: []
                              }));
                            }}
                          >
                            Search Again
                          </Button>
                          <Button 
                            size="lg"
                            onClick={() => {
                              // Filter to only include selected websites in the final design phase
                              const selectedSites = projectRequirements.similarWebsites.filter(site => site.selected);
                              if (selectedSites.length > 0) {
                                setProjectRequirements(prev => ({
                                  ...prev,
                                  similarWebsites: selectedSites
                                }));
                              }
                              setActiveTab('design');
                            }}
                            disabled={projectRequirements.similarWebsites.filter(site => site.selected).length === 0}
                          >
                            Continue to Design
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Design Tab Content */}
            <TabsContent value="design" className="space-y-6">
              <div className="mb-20">
                <Card>
                  <CardHeader>
                    <CardTitle>Design Your Project</CardTitle>
                    <CardDescription>
                      Select design screenshots that match your vision
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoadingDesigns ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-muted-foreground">Loading design inspirations for your project...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment as we fetch relevant screenshots.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Design Inspirations</h3>
                            <div className="flex gap-2">
                              <Select 
                                value={selectedLayout} 
                                onValueChange={setSelectedLayout}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Categories</SelectItem>
                                  {Object.keys(groupedScreenshots).map(category => (
                                    <SelectItem key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            Click on the screenshots that best match your vision for this project.
                          </p>

                          {/* Selected count summary */}
                          <div className="mt-2 p-3 bg-muted/30 rounded-md">
                            <p className="text-sm">
                              <span className="font-medium">{designScreenshots.filter(s => s.selected).length}</span> screenshots selected
                            </p>
                          </div>
                          
                          {/* Category based screenshot display */}
                          {selectedLayout === 'all' ? (
                            /* Show all categories with their respective screenshots */
                            Object.entries(groupedScreenshots).map(([category, screenshots]) => (
                              <div key={category} className="mt-8">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-base font-medium capitalize">{category} Designs</h3>
                                  <span className="text-xs text-muted-foreground">
                                    {screenshots.length} {screenshots.length === 1 ? 'screenshot' : 'screenshots'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {screenshots.map((screenshot) => (
                                    <div 
                                      key={screenshot.id}
                                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                        screenshot.selected 
                                          ? 'ring-2 ring-primary border-primary shadow-lg transform scale-105 z-10 bg-primary/5 outline outline-2 outline-primary outline-offset-2' 
                                          : 'hover:border-muted-foreground hover:shadow-sm hover:scale-[1.02] transition-transform'
                                      }`}
                                      onClick={() => {
                                        setDesignScreenshots(prev => 
                                          prev.map(s => 
                                            s.id === screenshot.id 
                                              ? { ...s, selected: !s.selected } 
                                              : s
                                          )
                                        );
                                      }}
                                    >
                                      <div className="relative">
                                        <img 
                                          src={screenshot.url} 
                                          alt={screenshot.title}
                                          className={`w-full object-cover object-top ${
                                            screenshot.selected ? 'h-56 brightness-110' : 'h-44'
                                          } transition-all duration-200`}
                                        />
                                        {screenshot.selected && (
                                          <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-full shadow-md">
                                            <CheckIcon className="h-5 w-5" />
                                          </div>
                                        )}
                                        <div className="absolute top-2 left-2">
                                          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full font-medium">
                                            {screenshot.category}
                                          </span>
                                        </div>
                                        {screenshot.selected && (
                                          <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-center py-1 text-xs font-medium">
                                            Selected
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-3">
                                        <h5 className="font-medium text-sm">{screenshot.title}</h5>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{screenshot.description}</p>
                                        
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {screenshot.tags.slice(0, 3).map((tag, tagIndex) => (
                                            <span 
                                              key={tagIndex}
                                              className="px-1.5 py-0.5 bg-muted text-xs rounded-sm"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                          {screenshot.tags.length > 3 && (
                                            <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                                              +{screenshot.tags.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            /* Show only screenshots from the selected category */
                            <div className="mt-6">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-medium capitalize">{selectedLayout} Designs</h3>
                                {groupedScreenshots[selectedLayout] && (
                                  <span className="text-xs text-muted-foreground">
                                    {groupedScreenshots[selectedLayout].length} {groupedScreenshots[selectedLayout].length === 1 ? 'screenshot' : 'screenshots'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedScreenshots[selectedLayout]?.map((screenshot) => (
                                  <div 
                                    key={screenshot.id}
                                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                      screenshot.selected 
                                        ? 'ring-2 ring-primary border-primary shadow-lg transform scale-105 z-10 bg-primary/5 outline outline-2 outline-primary outline-offset-2' 
                                        : 'hover:border-muted-foreground hover:shadow-sm hover:scale-[1.02] transition-transform'
                                    }`}
                                    onClick={() => {
                                      setDesignScreenshots(prev => 
                                        prev.map(s => 
                                          s.id === screenshot.id 
                                            ? { ...s, selected: !s.selected } 
                                            : s
                                        )
                                      );
                                    }}
                                  >
                                    <div className="relative">
                                      <img 
                                        src={screenshot.url} 
                                        alt={screenshot.title}
                                        className={`w-full object-cover object-top ${
                                          screenshot.selected ? 'h-56 brightness-110' : 'h-44'
                                        } transition-all duration-200`}
                                      />
                                      {screenshot.selected && (
                                        <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-full shadow-md">
                                          <CheckIcon className="h-5 w-5" />
                                        </div>
                                      )}
                                      <div className="absolute top-2 left-2">
                                        <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full font-medium">
                                          {screenshot.category}
                                        </span>
                                      </div>
                                      {screenshot.selected && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-center py-1 text-xs font-medium">
                                          Selected
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <h5 className="font-medium text-sm">{screenshot.title}</h5>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{screenshot.description}</p>
                                      
                                      {/* Tags */}
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {screenshot.tags.slice(0, 3).map((tag, tagIndex) => (
                                          <span 
                                            key={tagIndex}
                                            className="px-1.5 py-0.5 bg-muted text-xs rounded-sm"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {screenshot.tags.length > 3 && (
                                          <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                                            +{screenshot.tags.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {(!groupedScreenshots[selectedLayout] || groupedScreenshots[selectedLayout].length === 0) && (
                                <div className="text-center py-8">
                                  <p className="text-muted-foreground">No screenshots found for this category.</p>
                                  <Button 
                                    variant="link" 
                                    onClick={() => setSelectedLayout('all')}
                                    className="mt-2"
                                  >
                                    View all screenshots
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-6 flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => fetchDesignRecommendations()}
                          >
                            Refresh Screenshots
                          </Button>
                          
                          <Button 
                            className="px-8"
                            size="lg"
                            disabled={designScreenshots.filter(s => s.selected).length === 0}
                            onClick={() => {
                              setDesignComplete(true);
                              setActiveTab('review');
                              scrollToTop();
                            }}
                          >
                            Continue to Review
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Review Tab Content */}
            <TabsContent value="review" className="space-y-6">
              <div ref={reviewSectionRef} className="mb-20">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Project</CardTitle>
                    <CardDescription>
                      Review all your selections and finalize your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {isSubmitting ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                        <p className="text-muted-foreground">Finalizing your project...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment as we prepare your project.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Project Information Summary */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <InfoIcon className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-medium">Project Information</h3>
                          </div>
                          <div className="border rounded-md p-4 space-y-2">
                            <div>
                              <span className="font-medium">Project Type:</span> {projectRequirements.projectType}
                            </div>
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="mt-1 text-muted-foreground text-sm">{projectRequirements.projectDescription}</p>
                            </div>
                            <div>
                              <span className="font-medium">Target Audience:</span> {projectRequirements.targetAudience}
                            </div>
                            <div>
                              <span className="font-medium">Key Features:</span>
                              <ul className="mt-1 ml-5 list-disc text-sm space-y-1">
                                {projectRequirements.keyFeatures.map((feature, index) => (
                                  <li key={index}>{feature}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="font-medium">Design Preferences:</span>
                              <ul className="mt-1 ml-5 list-disc text-sm space-y-1">
                                {projectRequirements.designPreferences.map((preference, index) => (
                                  <li key={index}>{preference}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setActiveTab('info');
                              }}
                            >
                              Edit Information
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setReviewData(prev => ({...prev, approvedRequirements: !prev.approvedRequirements}));
                                }}
                              >
                                {reviewData.approvedRequirements ? (
                                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                {reviewData.approvedRequirements ? "Approved" : "Approve"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Research Summary */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <SearchIcon className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-medium">Research References</h3>
                          </div>
                          <div className="border rounded-md p-4">
                            {projectRequirements.similarWebsites && projectRequirements.similarWebsites.length > 0 ? (
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">Selected reference websites:</p>
                                {projectRequirements.similarWebsites.map((site, index) => (
                                  <div key={index} className="border-b pb-2 last:border-0">
                                    <h4 className="font-medium">{site.title}</h4>
                                    <a 
                                      href={site.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-sm"
                                    >
                                      {site.url}
                                    </a>
                                    <p className="text-xs text-muted-foreground mt-1">{site.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No reference websites selected.</p>
                            )}
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setActiveTab('research');
                              }}
                            >
                              Edit Research
                            </Button>
                          </div>
                        </div>
                        
                        {/* Design Summary */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <PaintbrushIcon className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-medium">Design Selections</h3>
                          </div>
                          <div className="border rounded-md p-4 space-y-4">
                            <div>
                              <span className="font-medium">Selected Layout:</span>
                              <div className="mt-2">
                                <span className="text-sm capitalize">{selectedLayout === 'all' ? 'All Categories' : selectedLayout || 'None selected'}</span>
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium">Selected Screenshots:</span>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {designScreenshots
                                  .filter(s => s.selected)
                                  .map((screenshot) => (
                                    <div key={screenshot.id} className="border rounded-md overflow-hidden">
                                      <img 
                                        src={screenshot.url} 
                                        alt={screenshot.title}
                                        className="w-full h-24 object-cover object-top"
                                      />
                                      <div className="p-2">
                                        <h5 className="text-xs font-medium truncate">{screenshot.title}</h5>
                                        <p className="text-xs text-muted-foreground truncate">{screenshot.category}</p>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                              {designScreenshots.filter(s => s.selected).length === 0 && (
                                <p className="text-sm text-muted-foreground">No screenshots selected.</p>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setActiveTab('design');
                              }}
                            >
                              Edit Design
                            </Button>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setReviewData(prev => ({...prev, approvedDesign: !prev.approvedDesign}));
                                }}
                              >
                                {reviewData.approvedDesign ? (
                                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                ) : (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                {reviewData.approvedDesign ? "Approved" : "Approve"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Final Notes */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-primary" />
                            <h3 className="text-lg font-medium">Additional Notes</h3>
                          </div>
                          <div className="relative">
                            <textarea
                              value={reviewData.finalFeedback}
                              onChange={(e) => setReviewData({...reviewData, finalFeedback: e.target.value})}
                              placeholder="Add any final instructions or feedback for the project..."
                              className="w-full min-h-[100px] p-3 rounded-md border"
                            />
                          </div>
                        </div>
                        
                        {/* Final Actions */}
                        <div className="pt-6 flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab('design')}
                          >
                            Go Back
                          </Button>
                          
                          <Button 
                            className="px-8"
                            size="lg"
                            disabled={!reviewData.approvedRequirements || !reviewData.approvedDesign}
                            onClick={async () => {
                              setIsSubmitting(true);
                              
                              // Generate the AI design document
                              await generateDesignDocument();
                              
                              try {
                                // Save project to Firestore
                                const projectId = await saveProjectToFirestore();
                                
                                // Set review complete
                                setReviewComplete(true);
                                setIsSubmitting(false);
                                
                                // Automatically navigate to projects page after a short delay
                                setTimeout(() => {
                                  // Use router navigation instead of window.location
                                  router.push('/dashboard/projects');
                                }, 2000); // 2 second delay to show success message
                              } catch (error) {
                                console.error('Error finalizing project:', error);
                                setIsSubmitting(false);
                              }
                            }}
                          >
                            Finalize Project
                          </Button>
                        </div>
                        
                        {/* Design Document Section */}
                        {designDocument && (
                          <div className="mt-8 border-t pt-8">
                            <div className="flex items-center gap-2 mb-4">
                              <FileCheck className="h-5 w-5 text-primary" />
                              <h3 className="text-lg font-medium">AI Design Document</h3>
                            </div>
                            
                            {designDocument.status === 'generating' ? (
                              <div className="flex flex-col items-center gap-3 py-8 text-center border rounded-md p-6 bg-muted/20">
                                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                                <p className="text-muted-foreground">Generating AI design document...</p>
                                <p className="text-xs text-muted-foreground">This may take a moment as we analyze your requirements and create a comprehensive plan.</p>
                              </div>
                            ) : designDocument.status === 'error' ? (
                              <div className="border rounded-md p-6 bg-red-50 text-red-700">
                                <p>There was an error generating your design document. Please try again.</p>
                                <Button 
                                  variant="outline" 
                                  className="mt-4" 
                                  onClick={generateDesignDocument}
                                >
                                  Retry
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-6 border rounded-md p-6 bg-muted/20">
                                <div>
                                  <h4 className="font-medium mb-2">Business Description</h4>
                                  <p className="text-sm">{designDocument.businessDescription}</p>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Recommended Tech Stack</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {designDocument.techStack.map((tech, index) => (
                                      <span 
                                        key={index} 
                                        className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Recommended Folder Structure</h4>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                                    {designDocument.folderStructure}
                                  </pre>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Database Structure</h4>
                                  <div className="space-y-4">
                                    {designDocument.database.tables.map((table, tableIndex) => (
                                      <div key={tableIndex} className="border rounded-md overflow-hidden">
                                        <div className="bg-muted p-2 font-medium">
                                          Table: {table.name}
                                        </div>
                                        <div className="p-2">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="border-b">
                                                <th className="text-left py-1 px-2">Field</th>
                                                <th className="text-left py-1 px-2">Type</th>
                                                <th className="text-left py-1 px-2">Description</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {table.fields.map((field, fieldIndex) => (
                                                <tr key={fieldIndex} className="border-b">
                                                  <td className="py-1 px-2 font-mono text-xs">{field.name}</td>
                                                  <td className="py-1 px-2 text-xs">{field.type}</td>
                                                  <td className="py-1 px-2 text-xs">{field.description}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {designDocument.sampleImages.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Design References</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {designDocument.sampleImages.map((image, imageIndex) => (
                                        <div key={imageIndex} className="border rounded-md overflow-hidden">
                                          <img 
                                            src={image} 
                                            alt={`Design reference ${imageIndex + 1}`}
                                            className="w-full h-32 object-cover object-top"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  <h4 className="font-medium mb-2">Recommendations</h4>
                                  <ul className="space-y-1 list-disc pl-5 text-sm">
                                    {designDocument.recommendations.map((rec, recIndex) => (
                                      <li key={recIndex}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="pt-4 flex justify-center">
                                  {isDownloading ? (
                                    <div className="flex flex-col items-center gap-3">
                                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                                      <p className="text-sm text-muted-foreground">
                                        Creating project package...
                                      </p>
                                    </div>
                                  ) : (
                                    <a 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        generateAndDownloadZip(
                                          projectRequirements, 
                                          designDocument, 
                                          designScreenshots.filter(s => s.selected)
                                        );
                                      }}
                                      href="#"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                      </svg>
                                      Download Complete Project Package
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {reviewComplete && (
        <div className="mt-4 border-t pt-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <h3 className="text-green-700 font-medium">Project Successfully Created!</h3>
            </div>
            <p className="mt-2 text-green-600 text-sm">
              Your project has been saved and is now available in your Projects dashboard. You will be redirected automatically in a moment.
            </p>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => {
                  // Reset form for new project
                  setProjectRequirements({
                    projectDescription: '',
                    projectType: '',
                    targetAudience: '',
                    keyFeatures: [],
                    designPreferences: [],
                    similarWebsites: [],
                    additionalNotes: ''
                  });
                  setActiveTab('info');
                  setReviewComplete(false);
                  setInfoComplete(false);
                  setResearchComplete(false);
                  setDesignComplete(false);
                  setDesignScreenshots([]);
                  setReviewData({
                    reviewNotes: '',
                    approvedRequirements: false,
                    approvedDesign: false,
                    finalFeedback: ''
                  });
                }}
              >
                Create New Project
              </Button>
              <Button
                onClick={() => {
                  // Navigate to projects page
                  router.push('/dashboard/projects');
                }}
              >
                View Projects
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 