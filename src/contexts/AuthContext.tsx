'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

// User preferences type
interface UserPreferences {
  onboardingComplete: boolean;
  interests: string[];
  suggestedWebsites: string[];
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userPreferences: UserPreferences;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  signup: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<UserCredential>;
};

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  onboardingComplete: false,
  interests: [],
  suggestedWebsites: []
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Load user preferences from localStorage when user changes
  useEffect(() => {
    if (!user) {
      setUserPreferences(DEFAULT_PREFERENCES);
      return;
    }
    
    try {
      const savedPrefs = localStorage.getItem(`user_prefs_${user.uid}`);
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }, [user]);

  // Update user preferences
  const updateUserPreferences = (prefs: Partial<UserPreferences>) => {
    setUserPreferences(prev => {
      const newPrefs = { ...prev, ...prefs };
      
      // Save to localStorage if user exists
      if (user) {
        try {
          localStorage.setItem(`user_prefs_${user.uid}`, JSON.stringify(newPrefs));
          
          // Set onboarding cookie to be accessible by middleware
          if (prefs.onboardingComplete !== undefined) {
            document.cookie = `onboardingComplete=${prefs.onboardingComplete}; path=/; max-age=${60*60*24*365}`;
          }
        } catch (error) {
          console.error('Error saving user preferences:', error);
        }
      }
      
      return newPrefs;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      // Set or remove authToken cookie based on login state
      if (user) {
        // User is signed in, set the auth cookie
        document.cookie = `authToken=${user.uid}; path=/; max-age=${60*60*24*7}`; // 7 days
      } else {
        // User is signed out, remove the auth cookie
        document.cookie = 'authToken=; path=/; max-age=0';
        document.cookie = 'onboardingComplete=; path=/; max-age=0';
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Set auth cookie immediately after signup
    document.cookie = `authToken=${userCredential.user.uid}; path=/; max-age=${60*60*24*7}`;
    return userCredential;
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Set auth cookie immediately after login
    document.cookie = `authToken=${userCredential.user.uid}; path=/; max-age=${60*60*24*7}`;
    return userCredential;
  };

  const logout = async () => {
    // Clear cookies before sign out
    document.cookie = 'authToken=; path=/; max-age=0';
    document.cookie = 'onboardingComplete=; path=/; max-age=0';
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };
  
  const googleSignIn = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    // Set auth cookie immediately after Google sign-in
    document.cookie = `authToken=${userCredential.user.uid}; path=/; max-age=${60*60*24*7}`;
    return userCredential;
  };

  const value = {
    user,
    loading,
    userPreferences,
    updateUserPreferences,
    signup,
    login,
    logout,
    resetPassword,
    googleSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 