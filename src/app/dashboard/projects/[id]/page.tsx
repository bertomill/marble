'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  Share2,
  Code,
  FileText,
  Folder,
  FileCode,
  CheckCircle,
  ExternalLink,
  Copy,
  Edit,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CroppedImage } from "@/components/ui/cropped-image";

// Project type definition
interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  targetAudience: string;
  keyFeatures: string[];
  designPreferences: string[];
  createdAt: string;
  updatedAt: string;
  status: string;
  companyWebsite?: string;
  companyDocuments?: string[];
  designDocument?: {
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
        }>;
      }>;
    };
    sampleImages: string[];
    recommendations: string[];
  };
  selectedScreenshots?: Array<{
    id: string;
    url: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
  }>;
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        // Get current user
        if (!auth.currentUser) {
          setError('You must be logged in to view project details');
          setLoading(false);
          return;
        }
        
        const projectDocRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectDocRef);
        
        if (!projectSnap.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }
        
        // Get project data with ID
        const projectData = {
          id: projectSnap.id,
          ...projectSnap.data()
        } as Project;
        
        setProject(projectData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project details');
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);
  
  // Function to download project assets
  const downloadProjectPackage = async () => {
    if (!project) return;
    
    try {
      setIsDownloading(true);
      
      // Create a new zip instance
      const zip = new JSZip();
      
      // Create a folder structure inside the zip
      const documentFolder = zip.folder("project-document") as JSZip;
      const imagesFolder = zip.folder("design-images") as JSZip;
      const databaseFolder = zip.folder("database-structure") as JSZip;
      
      // Add the JSON document with project details
      documentFolder.file("project-details.json", JSON.stringify({
        projectName: project.name,
        projectDescription: project.description,
        targetAudience: project.targetAudience,
        keyFeatures: project.keyFeatures,
        designPreferences: project.designPreferences,
        techStack: project.designDocument?.techStack || [],
        folderStructure: project.designDocument?.folderStructure || '',
        recommendations: project.designDocument?.recommendations || []
      }, null, 2));
      
      // Add README file
      documentFolder.file("README.md", `# ${project.name} Project

## Project Overview
${project.description}

## Target Audience
${project.targetAudience}

## Key Features
${project.keyFeatures?.map(feature => `- ${feature}`).join('\n') || ''}

## Design Preferences
${project.designPreferences?.map(pref => `- ${pref}`).join('\n') || ''}

## Technology Stack
${project.designDocument?.techStack?.map(tech => `- ${tech}`).join('\n') || ''}

## Folder Structure
\`\`\`
${project.designDocument?.folderStructure || ''}
\`\`\`

## Recommendations
${project.designDocument?.recommendations?.map(rec => `- ${rec}`).join('\n') || ''}
`);
      
      // Add database structure documentation
      if (project.designDocument?.database && project.designDocument.database.tables) {
        databaseFolder.file("database-schema.json", JSON.stringify(project.designDocument.database, null, 2));
        
        // Create a markdown documentation of the database schema
        let dbMarkdown = `# Database Schema\n\n`;
        project.designDocument.database.tables.forEach(table => {
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
      
      // Add images placeholder information
      if (project.selectedScreenshots && project.selectedScreenshots.length > 0) {
        // Add a references file
        imagesFolder.file("image-references.json", JSON.stringify(project.selectedScreenshots, null, 2));
        
        // Try to add actual images if available
        project.selectedScreenshots.forEach((screenshot, index) => {
          // Create a text file with image info if image fetching fails
          imagesFolder.file(`image-${index}-reference.txt`, 
            `Title: ${screenshot.title}\nURL: ${screenshot.url}\nCategory: ${screenshot.category}\nDescription: ${screenshot.description}\nTags: ${screenshot.tags.join(', ')}`
          );
        });
      }
      
      // Generate the zip file
      const zipContent = await zip.generateAsync({ type: "blob" });
      
      // Create a filename
      const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-project-package.zip`;
      
      // Download the file
      saveAs(zipContent, fileName);
      
    } catch (error) {
      console.error('Error generating zip file:', error);
      alert('Failed to generate the project package. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Function to copy shareable link
  const copyShareableLink = () => {
    try {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] gap-4">
        <div className="text-xl font-medium text-destructive">{error || 'Project not found'}</div>
        <Button onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyShareableLink}
          >
            {copiedLink ? <CheckCircle className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
            {copiedLink ? 'Copied!' : 'Share'}
          </Button>
          
          <Button 
            size="sm"
            onClick={downloadProjectPackage}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Package
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Project metadata */}
      <div className="flex flex-wrap gap-4">
        <Badge variant="outline" className="text-sm">
          Type: {project.type}
        </Badge>
        
        <Badge 
          variant={project.status === 'completed' ? 'success' : 
                 project.status === 'in-progress' ? 'default' : 'secondary'}
        >
          Status: {project.status}
        </Badge>
        
        <div className="text-sm text-muted-foreground">
          Created: {formatDate(project.createdAt)}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Updated: {formatDate(project.updatedAt)}
        </div>
        
        {project.companyWebsite && (
          <div className="flex items-center gap-1 text-sm">
            <span>Website:</span>
            <a 
              href={project.companyWebsite.startsWith('http') ? project.companyWebsite : `https://${project.companyWebsite}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {project.companyWebsite.replace(/^https?:\/\//, '')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="code">Code Structure</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Requirements</CardTitle>
              <CardDescription>Key information about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Project Description</h3>
                <p className="text-sm">{project.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Target Audience</h3>
                <p className="text-sm">{project.targetAudience}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Key Features</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {project.keyFeatures?.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Design Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {project.designPreferences?.map((pref, index) => (
                    <Badge key={index} variant="secondary">
                      {pref}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {project.selectedScreenshots && project.selectedScreenshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Design References</CardTitle>
                <CardDescription>Selected design inspirations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.selectedScreenshots.map((screenshot, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <div className="relative">
                        <CroppedImage 
                          src={screenshot.url} 
                          alt={screenshot.title}
                          className="w-full h-40 object-cover object-top"
                          cropBottom={5}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full font-medium">
                            {screenshot.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <h5 className="font-medium text-sm mb-1">{screenshot.title}</h5>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {screenshot.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {project.designDocument?.recommendations && project.designDocument.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Suggested approaches for implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 list-disc pl-5">
                  {project.designDocument.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Design Tab */}
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Design Assets</CardTitle>
              <CardDescription>Visual references and design elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {project.designDocument?.sampleImages && project.designDocument.sampleImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.designDocument.sampleImages.map((image, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <CroppedImage 
                        src={image} 
                        alt={`Design reference ${index + 1}`}
                        className="w-full h-32 object-cover object-top"
                        cropBottom={5}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No design assets available
                </div>
              )}
              
              {project.selectedScreenshots && project.selectedScreenshots.length > 0 && (
                <>
                  <Separator />
                  <h3 className="font-medium">Selected Screenshots</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.selectedScreenshots.map((screenshot, index) => (
                      <div key={index} className="border rounded-md overflow-hidden">
                        <div className="relative">
                          <CroppedImage 
                            src={screenshot.url} 
                            alt={screenshot.title}
                            className="w-full h-40 object-cover object-top"
                            cropBottom={5}
                          />
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full font-medium">
                              {screenshot.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h5 className="font-medium text-sm mb-1">{screenshot.title}</h5>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {screenshot.description}
                          </p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {screenshot.tags?.slice(0, 3).map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className="px-1.5 py-0.5 bg-muted text-xs rounded-sm"
                              >
                                {tag}
                              </span>
                            ))}
                            {screenshot.tags && screenshot.tags.length > 3 && (
                              <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                                +{screenshot.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Code Structure Tab */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Technology Stack</CardTitle>
              <CardDescription>Technologies suggested for this project</CardDescription>
            </CardHeader>
            <CardContent>
              {project.designDocument?.techStack && project.designDocument.techStack.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.designDocument.techStack.map((tech, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {tech}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No technology stack specified
                </div>
              )}
              
              {project.designDocument?.folderStructure && (
                <>
                  <Separator className="my-4" />
                  <h3 className="font-medium mb-4">Recommended Folder Structure</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-auto whitespace-pre">{project.designDocument.folderStructure}</pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Schema</CardTitle>
              <CardDescription>Recommended database structure</CardDescription>
            </CardHeader>
            <CardContent>
              {project.designDocument?.database?.tables && project.designDocument.database.tables.length > 0 ? (
                <div className="space-y-6">
                  {project.designDocument.database.tables.map((table, tableIndex) => (
                    <div key={tableIndex} className="border rounded-md overflow-hidden">
                      <div className="bg-muted p-3 font-medium">
                        Table: {table.name}
                      </div>
                      <div className="p-2">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Field</th>
                              <th className="text-left py-2 px-3">Type</th>
                              <th className="text-left py-2 px-3">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.fields.map((field, fieldIndex) => (
                              <tr key={fieldIndex} className="border-b">
                                <td className="py-2 px-3 font-mono text-xs">{field.name}</td>
                                <td className="py-2 px-3 text-xs">{field.type}</td>
                                <td className="py-2 px-3 text-xs">{field.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No database schema available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/projects')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${projectId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit Project
          </Button>
          
          <Button 
            onClick={downloadProjectPackage}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Package
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 