'use client';

import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, User, FileCode, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Mock data - this would come from your database in a real app
const mockFriends = [
  { id: '1', name: 'Alex Johnson', email: 'alex@example.com', online: true, avatar: '' },
  { id: '2', name: 'Sam Smith', email: 'sam@example.com', online: false, avatar: '' },
  { id: '3', name: 'Taylor Chen', email: 'taylor@example.com', online: true, avatar: '' },
  { id: '4', name: 'Jordan Brown', email: 'jordan@example.com', online: false, avatar: '' },
  { id: '5', name: 'Jamie Garcia', email: 'jamie@example.com', online: true, avatar: '' },
];

const mockExamples = [
  { id: '1', title: 'E-commerce Dashboard', category: 'Dashboard', url: '/examples/ecommerce' },
  { id: '2', title: 'Portfolio Template', category: 'Landing Page', url: '/examples/portfolio' },
  { id: '3', title: 'Blog Platform', category: 'Content', url: '/examples/blog' },
  { id: '4', title: 'Admin Panel', category: 'Dashboard', url: '/examples/admin' },
  { id: '5', title: 'SaaS Landing Page', category: 'Landing Page', url: '/examples/saas' },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchType, setSearchType] = useState('friends');
  const [friendResults, setFriendResults] = useState(mockFriends);
  const [exampleResults, setExampleResults] = useState(mockExamples);

  const handleSearch = (value: string) => {
    if (searchType === 'friends') {
      setFriendResults(
        value === '' 
          ? mockFriends 
          : mockFriends.filter(friend => 
              friend.name.toLowerCase().includes(value.toLowerCase()) || 
              friend.email.toLowerCase().includes(value.toLowerCase())
            )
      );
    } else {
      setExampleResults(
        value === '' 
          ? mockExamples 
          : mockExamples.filter(example => 
              example.title.toLowerCase().includes(value.toLowerCase()) || 
              example.category.toLowerCase().includes(value.toLowerCase())
            )
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700 hover:text-white">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Search</DialogTitle>
        </DialogHeader>
        <Tabs value={searchType} onValueChange={setSearchType}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="friends" className="flex items-center gap-2 text-gray-100 data-[state=active]:bg-gray-800">
              <User className="h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2 text-gray-100 data-[state=active]:bg-gray-800">
              <FileCode className="h-4 w-4" />
              Website Examples
            </TabsTrigger>
          </TabsList>
          <TabsContent value="friends" className="mt-3">
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Search friends..." onValueChange={handleSearch} />
              <CommandList>
                <CommandEmpty>No friends found.</CommandEmpty>
                <CommandGroup heading="Friends">
                  {friendResults.map(friend => (
                    <CommandItem key={friend.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{friend.name}</div>
                          <div className="text-sm text-muted-foreground">{friend.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={friend.online ? "success" : "secondary"} className="rounded-full px-2 text-xs">
                          {friend.online ? 'Online' : 'Offline'}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </TabsContent>
          <TabsContent value="examples" className="mt-3">
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Search examples..." onValueChange={handleSearch} />
              <CommandList>
                <CommandEmpty>No examples found.</CommandEmpty>
                <CommandGroup heading="Website Examples">
                  {exampleResults.map(example => (
                    <CommandItem key={example.id}>
                      <div className="flex flex-col">
                        <div>{example.title}</div>
                        <div className="text-sm text-muted-foreground">{example.category}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 