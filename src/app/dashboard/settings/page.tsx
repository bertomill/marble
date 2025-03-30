'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { User, updateProfile, updateEmail } from 'firebase/auth';
import { useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('system');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    marketing: true,
    updates: true,
    teamActivity: false,
  });
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || '');
        setEmail(currentUser.email || '');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update display name
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      
      // Update email (this usually requires re-authentication)
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      
      // Refresh user to see changes
      setUser(auth.currentUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      // You would typically show an error message here
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how others see you on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  Your email is used for communications and account recovery.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea 
                  id="bio"
                  className="w-full min-h-[100px] p-2.5 rounded-md border border-border bg-card dark:bg-[#121212] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="A brief description about yourself"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security and authentication methods.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your password regularly to keep your account secure.
                  </p>
                </div>
                <Button variant="outline">Change Password</Button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Switch 
                  checked={twoFactorEnabled} 
                  onCheckedChange={setTwoFactorEnabled} 
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete your account and all of your content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. This action is permanent.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what types of emails you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Marketing</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and special offers.
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications.marketing} 
                  onCheckedChange={(checked) => setEmailNotifications({
                    ...emailNotifications,
                    marketing: checked
                  })} 
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <h4 className="font-medium">Product Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about product updates and new features.
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications.updates} 
                  onCheckedChange={(checked) => setEmailNotifications({
                    ...emailNotifications,
                    updates: checked
                  })} 
                />
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <h4 className="font-medium">Team Activity</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about actions from your team members.
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications.teamActivity} 
                  onCheckedChange={(checked) => setEmailNotifications({
                    ...emailNotifications,
                    teamActivity: checked
                  })} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Notification Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>
                Customize how Marble looks for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Color Theme</Label>
                <RadioGroup 
                  value={theme} 
                  onValueChange={setTheme}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem 
                      value="light" 
                      id="theme-light" 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor="theme-light"
                      className={`
                        flex flex-col items-center justify-between rounded-lg border-2 border-border p-4 hover:border-primary
                        ${theme === 'light' ? 'border-primary' : ''}
                      `}
                    >
                      <div className="w-full h-24 bg-white rounded-md border border-border mb-2 flex items-center justify-center">
                        <div className="w-1/2 h-3 bg-gray-200 rounded-md"></div>
                      </div>
                      <span>Light</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="dark" 
                      id="theme-dark" 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor="theme-dark"
                      className={`
                        flex flex-col items-center justify-between rounded-lg border-2 border-border p-4 hover:border-primary
                        ${theme === 'dark' ? 'border-primary' : ''}
                      `}
                    >
                      <div className="w-full h-24 bg-[#121212] rounded-md border border-border mb-2 flex items-center justify-center">
                        <div className="w-1/2 h-3 bg-gray-700 rounded-md"></div>
                      </div>
                      <span>Dark</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem 
                      value="system" 
                      id="theme-system" 
                      className="sr-only" 
                    />
                    <Label
                      htmlFor="theme-system"
                      className={`
                        flex flex-col items-center justify-between rounded-lg border-2 border-border p-4 hover:border-primary
                        ${theme === 'system' ? 'border-primary' : ''}
                      `}
                    >
                      <div className="w-full h-24 bg-gradient-to-r from-white to-[#121212] rounded-md border border-border mb-2 flex items-center justify-center">
                        <div className="w-1/2 h-3 bg-gradient-to-r from-gray-200 to-gray-700 rounded-md"></div>
                      </div>
                      <span>System</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Apply Theme</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 