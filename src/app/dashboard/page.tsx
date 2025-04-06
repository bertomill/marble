'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Clock, 
  Users, 
  Star, 
  Activity,
  ExternalLink,
  Plus,
  FileText,
  Settings,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { TourButton } from './TourWrapper';

// Project interface
interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  progress?: number;
}

// Create a client component for dashboard content
function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Projects', value: '0', icon: <Star className="h-5 w-5" />, change: 'Loading...' },
    { label: 'Team Members', value: '0', icon: <Users className="h-5 w-5" />, change: 'Loading...' },
    { label: 'Activity Score', value: '0%', icon: <Activity className="h-5 w-5" />, change: 'Loading...' },
    { label: 'Uptime', value: '99.9%', icon: <Clock className="h-5 w-5" />, change: 'Last 30 days' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set user from auth
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user's projects
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef, 
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc'), 
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        
        const projectData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        setProjects(projectData);

        // Calculate project stats
        const totalProjects = projectData.length;
        const completedProjects = projectData.filter(p => p.status === 'completed').length;
        const inProgressProjects = projectData.filter(p => p.status === 'in-progress' || p.status === 'In Progress').length;
        
        // Get projects created this month
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const projectsThisMonth = projectData.filter(p => {
          if (!p.createdAt) return false;
          const createdDate = p.createdAt.toDate();
          return createdDate >= thisMonth;
        }).length;

        // Update stats with real data
        setStats([
          { 
            label: 'Total Projects', 
            value: totalProjects.toString(), 
            icon: <Star className="h-5 w-5" />, 
            change: `+${projectsThisMonth} this month` 
          },
          { 
            label: 'Completed', 
            value: completedProjects.toString(), 
            icon: <CheckCircle className="h-5 w-5" />, 
            change: `${Math.round((completedProjects/Math.max(totalProjects, 1))*100)}% completion rate` 
          },
          { 
            label: 'In Progress', 
            value: inProgressProjects.toString(), 
            icon: <Activity className="h-5 w-5" />, 
            change: `${totalProjects > 0 ? Math.round((inProgressProjects/totalProjects)*100) : 0}% of projects` 
          },
          { 
            label: 'Uptime', 
            value: '99.9%', 
            icon: <Clock className="h-5 w-5" />, 
            change: 'Last 30 days' 
          },
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Calculate project progress based on status
  const getProgressFromStatus = (status: string): number => {
    switch(status.toLowerCase()) {
      case 'completed':
        return 100;
      case 'in review':
        return 90;
      case 'in progress':
        return 50;
      case 'planning':
        return 25;
      default:
        return 0;
    }
  };

  // Format recent projects with proper progress values
  const recentProjects = projects.map(project => ({
    id: project.id,
    name: project.name,
    progress: project.progress ?? getProgressFromStatus(project.status),
    status: project.status
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center dashboard-welcome">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Robert Mill'}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your projects today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <TourButton />
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11 font-medium text-base shadow-md new-project-button">
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg border border-border/50 shadow-sm p-4 dark:shadow-none dark:border-border/30 dark:bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1">{loading ? '...' : stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{loading ? 'Loading...' : stat.change}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects Section */}
      <div className="dashboard-recent-projects">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link 
            href="/dashboard/projects" 
            className="text-sm text-primary flex items-center"
          >
            View all <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/50 dark:border-border/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Project</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : recentProjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <p className="text-muted-foreground">No projects found</p>
                    <Link href="/dashboard/create">
                      <Button variant="link" className="mt-2">Create your first project</Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                recentProjects.map((project) => (
                  <tr key={project.id} className="border-b border-border/50 dark:border-border/30 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">{project.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              project.status.toLowerCase() === 'completed' 
                                ? 'bg-green-500' 
                                : project.status.toLowerCase() === 'in review' 
                                ? 'bg-blue-500' 
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-muted-foreground text-sm">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status.toLowerCase() === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : project.status.toLowerCase() === 'in review' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/projects/${project.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/create">
            <div className="bg-card hover:bg-card/80 cursor-pointer rounded-lg border border-border/50 p-4 flex items-center gap-4 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">New Project</h3>
                <p className="text-sm text-muted-foreground">Create a project</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/projects">
            <div className="bg-card hover:bg-card/80 cursor-pointer rounded-lg border border-border/50 p-4 flex items-center gap-4 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">All Projects</h3>
                <p className="text-sm text-muted-foreground">View all projects</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/settings">
            <div className="bg-card hover:bg-card/80 cursor-pointer rounded-lg border border-border/50 p-4 flex items-center gap-4 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">Configure app</p>
              </div>
            </div>
          </Link>
          
          <Link href="/dashboard/feedback">
            <div className="bg-card hover:bg-card/80 cursor-pointer rounded-lg border border-border/50 p-4 flex items-center gap-4 transition-colors">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Feedback</h3>
                <p className="text-sm text-muted-foreground">Send us feedback</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Export a page component without props
export default function DashboardPage() {
  return <DashboardContent />;
} 