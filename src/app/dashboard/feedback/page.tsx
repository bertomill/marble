'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare, Star, User, Sparkles } from 'lucide-react';
import FeedbackForm from '@/components/feedback-form';

interface FeedbackItem {
  id: string;
  message: string;
  type: string;
  rating: number | null;
  source: string;
  createdAt: Timestamp;
  status: string;
  userId: string | null;
  userEmail: string | null;
  anonymous: boolean;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        
        // Make sure user is authenticated
        if (!auth.currentUser) {
          throw new Error('You must be logged in to view feedback');
        }
        
        // Query the feedback collection
        const q = query(
          collection(db, 'feedback'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const feedbackItems: FeedbackItem[] = [];
        
        querySnapshot.forEach((doc) => {
          feedbackItems.push({
            id: doc.id,
            ...doc.data()
          } as FeedbackItem);
        });
        
        setFeedback(feedbackItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
        console.error('Error fetching feedback:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedback();
  }, []);
  
  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'feedback', id), {
        status
      });
      
      // Update local state
      setFeedback(feedback.map(item => 
        item.id === id ? { ...item, status } : item
      ));
    } catch (err) {
      console.error('Error updating feedback status:', err);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'feature':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'ux':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Feedback Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">User Feedback</h2>
            
            {loading && <p>Loading feedback...</p>}
            
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
                {error}
              </div>
            )}
            
            {!loading && feedback.length === 0 && (
              <p className="text-gray-500">No feedback submitted yet.</p>
            )}
            
            <div className="space-y-4">
              {feedback.map((item) => (
                <div 
                  key={item.id} 
                  className="border rounded-md p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="font-medium capitalize">{item.type}</span>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Unknown date'}
                    </div>
                  </div>
                  
                  <p className="mb-3">{item.message}</p>
                  
                  {item.rating && (
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < (item.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                      {item.anonymous ? 'Anonymous' : item.userEmail || 'Unknown user'}
                    </div>
                    
                    <div className="flex gap-2">
                      {item.status !== 'resolved' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                      )}
                      
                      {item.status !== 'closed' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, 'closed')}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
} 