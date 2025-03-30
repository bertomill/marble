'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
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
  HelpCircle,
  UserPlus,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Set user from auth
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Sample data for dashboard cards
  const stats = [
    { label: 'Total Projects', value: '12', icon: <Star className="h-5 w-5" />, change: '+2 this month' },
    { label: 'Team Members', value: '5', icon: <Users className="h-5 w-5" />, change: '+1 this week' },
    { label: 'Activity Score', value: '85%', icon: <Activity className="h-5 w-5" />, change: '+5% from last week' },
    { label: 'Uptime', value: '99.9%', icon: <Clock className="h-5 w-5" />, change: 'Last 30 days' },
  ];

  // Sample recent projects
  const recentProjects = [
    { id: 1, name: 'E-commerce Redesign', progress: 75, status: 'In Progress' },
    { id: 2, name: 'Marketing Website', progress: 100, status: 'Completed' },
    { id: 3, name: 'Mobile App UI', progress: 40, status: 'In Progress' },
    { id: 4, name: 'SaaS Dashboard', progress: 90, status: 'In Review' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Robert Mill'}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your projects today.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11 font-medium text-base shadow-md">
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg border border-border/50 shadow-sm p-4 dark:shadow-none dark:border-border/30 dark:bg-card/50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects Section */}
      <div>
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
              {recentProjects.map((project) => (
                <tr key={project.id} className="border-b border-border/50 dark:border-border/30 hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium">{project.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            project.status === 'Completed' 
                              ? 'bg-green-500' 
                              : project.status === 'In Review' 
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
                      project.status === 'Completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : project.status === 'In Review' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="outline" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-card rounded-lg border border-border/50 dark:border-border/30 shadow-sm p-6 dark:shadow-none dark:bg-card/50">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Invite Team
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              New Document
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" className="justify-start">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Center
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border/50 dark:border-border/30 shadow-sm p-6 dark:shadow-none dark:bg-card/50">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Alex joined the team</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Marketing Website project completed</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-300">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">New comment on E-commerce Redesign</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 