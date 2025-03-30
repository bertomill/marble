'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Image from 'next/image';

// Define industry types
type Industry = {
  id: string;
  name: string;
};

const industries: Industry[] = [
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'saas', name: 'SaaS' },
  { id: 'technology', name: 'Technology' },
  { id: 'finance', name: 'Finance' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'education', name: 'Education' },
  { id: 'real-estate', name: 'Real Estate' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'travel', name: 'Travel' },
  { id: 'food-beverage', name: 'Food & Beverage' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'fitness', name: 'Fitness' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'media', name: 'Media' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'professional-services', name: 'Professional Services' },
  { id: 'non-profit', name: 'Non-profit' },
  { id: 'art-design', name: 'Art & Design' },
];

export default function OnboardingPage() {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const toggleIndustry = (industryId: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industryId)
        ? prev.filter(id => id !== industryId)
        : [...prev, industryId]
    );
  };

  const handleContinue = () => {
    if (selectedIndustries.length > 0) {
      // In a real app, you would save these preferences to the user's profile
      console.log('Selected industries:', selectedIndustries);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="flex justify-center mb-8">
          {/* Replace with your actual logo */}
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-white text-xl font-bold">M</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-3">Welcome to Marble</h1>
        <p className="text-center text-gray-400 mb-10">Begin by creating an account</p>

        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4">Select your interests</h2>
          <p className="text-gray-400 mb-6">
            We'll recommend top websites based on the topics you select.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => toggleIndustry(industry.id)}
                className={`py-2 px-4 rounded-md text-left transition-all ${
                  selectedIndustries.includes(industry.id)
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {industry.name}
              </button>
            ))}
          </div>
        </div>

        <Button 
          onClick={handleContinue}
          disabled={selectedIndustries.length === 0}
          className="w-full bg-white text-black hover:bg-white/90 py-6 rounded-md font-medium"
        >
          Continue
        </Button>
      </div>
    </div>
  );
} 