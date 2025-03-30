'use client';

import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  FileText,
  Trash2,
  Edit,
  Eye,
  Code,
  Folder,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Project type definition based on Firestore data
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
}

export default function ProjectsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Fetch projects whenever user changes
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Get current user
        if (!user) {
          console.log('No user logged in');
          setProjects([]);
          setLoading(false);
          return;
        }
        
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef, 
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc'), 
          limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        
        const projectData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        setProjects(projectData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);
  
  // Filter projects based on search term and status filter
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      searchTerm === '' || 
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get unique statuses for the filter dropdown
  const statuses = Array.from(new Set(projects.map(p => p.status))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Browse and manage your website projects</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={() => router.push('/dashboard/create')}
        >
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>
      
      {/* Filters and search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[180px]">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="All Statuses" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Projects table */}
      <Card>
        <CardHeader className="p-6">
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            {filteredProjects.length} projects found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">
                    <div className="flex items-center gap-1">
                      Project <ArrowUpDown className="h-3 w-3 ml-1" />
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          >
                            <Folder className="h-5 w-5 text-primary" />
                          </div>
                          <div 
                            className="cursor-pointer"
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          >
                            <div className="font-medium">{project.name || 'Unnamed Project'}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {project.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {project.type || 'Not specified'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={project.status === 'completed' ? 'success' : 
                                 project.status === 'in-progress' ? 'default' : 'secondary'}
                        >
                          {project.status || 'Not started'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}/code`)}>
                              <Code className="h-4 w-4 mr-2" /> View Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}/documents`)}>
                              <FileText className="h-4 w-4 mr-2" /> View Documents
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No projects found. Try adjusting your filters or <Button variant="link" onClick={() => router.push('/dashboard/create')}>create a new project</Button>.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-6 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 