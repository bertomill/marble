'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function BulkUploadPage() {
  const router = useRouter();
  // const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [batchMetadata, setBatchMetadata] = useState({
    industry: '',
    url: '',
    siteName: ''
  });
  const [notification, setNotification] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry options for dropdown
  const industryOptions = [
    "AI & Machine Learning",
    "Agriculture",
    "Art & Photography",
    "Automotive",
    "B2B",
    "B2C",
    "Banking",
    "Beauty",
    "Blockchain",
    "Clothing & Fashion",
    "Construction",
    "Consumer Packaged Goods",
    "Crypto",
    "Cybersecurity",
    "Design",
    "E-commerce",
    "Education",
    "Electronics",
    "Energy",
    "Entertainment",
    "Fashion",
    "Finance",
    "Fitness",
    "Food & Beverage",
    "Gaming",
    "Government",
    "Healthcare",
    "Home & Garden",
    "Hospitality",
    "Insurance",
    "IoT",
    "Jewelry & Accessories",
    "Legal",
    "Lifestyle",
    "Logistics",
    "Manufacturing",
    "Marketplace",
    "Marketing",
    "Media",
    "Non-profit",
    "Pet Care",
    "Real Estate",
    "Retail",
    "SaaS",
    "Services",
    "Social Media",
    "Sports & Recreation",
    "Technology",
    "Telecommunications",
    "Toys & Games",
    "Travel",
    "Transportation"
  ].sort();

  // Protect admin route
  useEffect(() => {
    // Commenting out the authentication check for now
    // if (user && user.email !== 'admin@example.com') { // Replace with your admin email
    //   router.push('/dashboard');
    // }
  }, [/*user,*/ router]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Handle clipboard paste
  const handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    
    if (!e.clipboardData) return;
    
    // Check for files (screenshots)
    const files = Array.from(e.clipboardData.files);
    if (files.length > 0) {
      handleFiles(files);
      setNotification('Screenshots pasted successfully!');
      return;
    }
    
    // Check for images in clipboard items
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
    
    if (imageItems.length > 0) {
      const imageFiles = await Promise.all(
        imageItems.map(async (item) => {
          const blob = item.getAsFile();
          if (!blob) return null;
          
          // Create a File object from the Blob
          const timestamp = new Date().getTime();
          const fileName = `clipboard_image_${timestamp}.png`;
          return new File([blob], fileName, { type: blob.type });
        })
      );
      
      const validFiles = imageFiles.filter(Boolean) as File[];
      if (validFiles.length > 0) {
        handleFiles(validFiles);
        setNotification('Screenshots pasted successfully!');
      }
    }
  };

  // Add event listener for paste
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    
    // Auto-clear notification after 3 seconds
    if (notification) {
      const timer = setTimeout(() => {
        setNotification('');
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('paste', handlePaste);
      };
    }
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [notification]);

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Please select image files only');
      return;
    }

    // Add new files to existing pending files
    setPendingFiles(prev => [...prev, ...imageFiles]);
  };

  const processFiles = async () => {
    const imageFiles = pendingFiles;
    
    setProgress({ current: 0, total: imageFiles.length });
    setIsProcessing(true);
    setResults([]);
    setError('');

    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const result = await processImage(imageFiles[i], i + 1, imageFiles.length);
        setResults(prev => [...prev, result]);
        setProgress({ current: i + 1, total: imageFiles.length });
      } catch (err) {
        console.error(`Error processing image ${imageFiles[i].name}:`, err);
        setError(`Error processing ${imageFiles[i].name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setIsProcessing(false);
    setPendingFiles([]);
  };

  const processImage = async (file: File, current: number, total: number) => {
    // Step 1: Convert image to base64 for analysis
    const base64Image = await fileToBase64(file);
    
    // Step 2: Analyze with OpenAI
    const analysis = await analyzeImage(base64Image);
    
    // Step 3: Upload to Firebase Storage
    const screenshotId = uuidv4();
    const websiteId = uuidv4();
    const screenshotPath = `screenshots/${websiteId}/${screenshotId}.jpg`;
    
    const storageRef = ref(storage, screenshotPath);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);
    
    // Step 4: Create combined tags
    const combinedTags = [
      ...(analysis.suggestedTags || []),
      ...(analysis.designPatterns || []),
      ...(analysis.functionalPurpose || []),
      ...(analysis.userTasks || []),
      analysis.userJourneyStage ? [analysis.userJourneyStage] : [],
      ...batchMetadata.industry.split(',').map(tag => tag.trim()).filter(Boolean)
    ].filter(Boolean);
    
    // Helper function to flatten nested arrays
    const flattenNestedArrays = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        // Check if any element is an array
        const hasNestedArray = obj.some(item => Array.isArray(item));
        if (hasNestedArray) {
          // Flatten one level deep
          return obj.flat();
        }
        return obj.map(flattenNestedArrays);
      }
      
      const result: any = {};
      for (const key in obj) {
        result[key] = flattenNestedArrays(obj[key]);
      }
      return result;
    };
    
    // Step 5: Create website example object
    const websiteExample = {
      title: batchMetadata.siteName ? 
        `${batchMetadata.siteName} - ${file.name.replace(/\.[^/.]+$/, "")}` : 
        file.name.replace(/\.[^/.]+$/, ""),
      description: `Design analysis of ${batchMetadata.siteName || file.name}`,
      url: batchMetadata.url,
      category: analysis.industryRelevance || analysis.designStyle || [],
      type: 'Screen',
      tags: combinedTags,
      functionalPurpose: analysis.functionalPurpose || [],
      userJourneyStage: analysis.userJourneyStage || '',
      screenshots: [
        {
          id: screenshotId,
          imageUrl: imageUrl,
          altText: `Screenshot of ${batchMetadata.siteName || file.name}`,
          description: `Screenshot of ${batchMetadata.siteName || file.name}`,
          components: analysis.components || []
        }
      ],
      designSystem: {
        colors: analysis.colorPalette || [],
        typography: analysis.typography || {},
        layout: analysis.layout || {},
        designStyle: analysis.designStyle || [],
        accessibilityNotes: analysis.accessibilityNotes || '',
        functionalPurpose: analysis.functionalPurpose || [],
        userJourneyStage: analysis.userJourneyStage || '',
        industryRelevance: analysis.industryRelevance || [],
        userTasks: analysis.userTasks || []
      },
      siteName: batchMetadata.siteName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Flatten any nested arrays before saving to Firestore
    const flattenedWebsiteExample = flattenNestedArrays(websiteExample);
    
    // Step 6: Save to Firestore
    const docRef = await addDoc(collection(db, 'websiteExamples'), flattenedWebsiteExample);
    
    return {
      id: docRef.id,
      imageUrl,
      fileName: file.name,
      analysis
    };
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  };

  // Function to save batch settings
  const saveBatchSettings = () => {
    try {
      localStorage.setItem('batchMetadata', JSON.stringify(batchMetadata));
      setNotification('Batch settings saved!');
    } catch (error) {
      console.error('Error saving batch settings:', error);
    }
  };
  
  // Function to load batch settings
  const loadBatchSettings = () => {
    try {
      const savedSettings = localStorage.getItem('batchMetadata');
      if (savedSettings) {
        setBatchMetadata(JSON.parse(savedSettings));
        setNotification('Batch settings loaded!');
      }
    } catch (error) {
      console.error('Error loading batch settings:', error);
    }
  };
  
  // Load saved settings on component mount
  useEffect(() => {
    loadBatchSettings();
  }, []);

  // Add keyboard shortcut for processing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to process pending screenshots
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && pendingFiles.length > 0 && !isProcessing) {
        processFiles();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingFiles, isProcessing]);

  // Add keyboard shortcuts for batch metadata fields
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+1 to focus Site Name
      if (e.altKey && e.key === '1') {
        const siteNameInput = document.getElementById('site-name-input');
        if (siteNameInput) siteNameInput.focus();
      }
      // Alt+2 to focus URL
      else if (e.altKey && e.key === '2') {
        const urlInput = document.getElementById('url-input');
        if (urlInput) urlInput.focus();
      }
      // Alt+3 to focus Industry
      else if (e.altKey && e.key === '3') {
        const industryInput = document.getElementById('industry-input');
        if (industryInput) industryInput.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Video background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          className="absolute w-full h-full object-cover opacity-60 video-smooth"
          autoPlay 
          loop 
          muted 
          playsInline
          style={{ 
            transform: 'scale(1.1)', 
            animationPlayState: 'running' 
          }}
        >
          <source src="/limestone_bg.mp4" type="video/mp4" />
        </video>
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10 z-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        ></div>
      </div>
      
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-white mb-6">Bulk Screenshot Upload</h1>
        
        {/* Batch metadata form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Batch Metadata</h2>
          <p className="text-gray-300 mb-4">
            Set common metadata for all uploaded screenshots. This will be combined with AI-detected metadata.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">
                Site Name <kbd className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-xs">Alt+1</kbd>
              </label>
              <input
                id="site-name-input"
                type="text"
                value={batchMetadata.siteName}
                onChange={(e) => setBatchMetadata({...batchMetadata, siteName: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
                placeholder="E.g., Example Website"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">
                URL <kbd className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-xs">Alt+2</kbd>
              </label>
              <input
                id="url-input"
                type="text"
                value={batchMetadata.url}
                onChange={(e) => setBatchMetadata({...batchMetadata, url: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
                placeholder="E.g., https://example.com"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">
                Industry <kbd className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-xs">Alt+3</kbd>
              </label>
              <select
                id="industry-input"
                value={batchMetadata.industry}
                onChange={(e) => setBatchMetadata({...batchMetadata, industry: e.target.value})}
                className="w-full bg-gray-700 text-white rounded-md px-4 py-2"
              >
                <option value="">Select an industry</option>
                {industryOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={saveBatchSettings}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Save Batch Settings
            </button>
          </div>
        </div>
        
        {/* Pending Screenshots Preview */}
        {pendingFiles.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Pending Screenshots ({pendingFiles.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingFiles([])}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={processFiles}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>Process All</span>
                  <kbd className="px-1.5 py-0.5 bg-green-800 rounded text-xs">⌘+Enter</kbd>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pendingFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setPendingFiles(pendingFiles.filter((_, i) => i !== index));
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    ×
                  </button>
                  <p className="text-xs text-gray-300 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Upload area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center transition-colors ${
            dragActive ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-purple-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          tabIndex={0} // Make div focusable for keyboard events
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
          
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            Drag & Drop Screenshots Here
          </h3>
          
          <p className="text-gray-400 mb-2">
            Or click to select files from your computer
          </p>
          
          <p className="text-purple-300 mb-4">
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">⌘ + V</kbd> to paste screenshots directly
          </p>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            disabled={isProcessing}
          >
            Select Screenshots
          </button>
          
          {pendingFiles.length > 0 && (
            <button
              onClick={processFiles}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mt-4"
            >
              Process Screenshots
            </button>
          )}
        </div>
        
        {/* Progress */}
        {isProcessing && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Processing Screenshots</h2>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-gray-300">
              Please wait while we analyze your screenshots. This may take a few minutes.
            </p>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="text-red-200">{error}</p>
          </div>
        )}
        
        {/* Notification */}
        {notification && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Notification</h2>
            <p className="text-green-200">{notification}</p>
          </div>
        )}
        
        {/* Results */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Processed Screenshots ({results.length})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                  <div className="aspect-video relative">
                    <img 
                      src={result.imageUrl} 
                      alt={result.fileName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1">{result.fileName}</h3>
                    <p className="text-gray-400 text-sm mb-2">ID: {result.id}</p>
                    
                    {result.analysis.functionalPurpose && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-400">Functional Purpose:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.analysis.functionalPurpose.map((purpose: string, i: number) => (
                            <span key={i} className="text-xs bg-purple-900/50 text-purple-200 px-2 py-0.5 rounded">
                              {purpose}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.analysis.userJourneyStage && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-400">Journey Stage:</span>
                        <span className="ml-2 text-xs bg-blue-900/50 text-blue-200 px-2 py-0.5 rounded">
                          {result.analysis.userJourneyStage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
