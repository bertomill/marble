// Use the backend URL from environment variables, or default to local API routes if not set
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Python backend URL - Points to the Python Flask backend instead of Next.js API routes
// In development, this typically runs on port 8080 while Next.js runs on 3000/3003
const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8080';

/**
 * Base fetch function for API calls
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    console.log(`Making API call to: ${url}`, options);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Try to extract detailed error information
      try {
        const errorData = await response.json();
        console.error(`API error response (${response.status}):`, errorData);
        
        // Create a more informative error message
        const errorMessage = errorData.message || errorData.error || `HTTP error! Status: ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        // If we can't parse the error as JSON, use a generic message
        console.error(`API error (${response.status}), couldn't parse error response:`, parseError);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Base fetch function for Python backend API calls 
 */
async function pythonApiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${PYTHON_BACKEND_URL}${endpoint}`;
  console.log(`Calling Python backend: ${url}`, options);
  
  try {
    // Add CORS mode and credentials
    const fetchOptions = {
      ...options,
      mode: 'cors' as RequestMode,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      }
    };
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      // Try to get the error response as JSON
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = JSON.stringify(errorJson, null, 2);
        console.error(`Error response from backend (JSON): ${response.status} ${response.statusText}`, errorJson);
      } catch {
        // If can't parse as JSON, get as text
        errorDetails = await response.text();
        console.error(`Error response from backend (text): ${response.status} ${response.statusText}`, errorDetails);
      }
      
      throw new Error(`HTTP error! Status: ${response.status} - ${errorDetails || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successful response from backend for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error connecting to Python backend (${url}):`, error);
    
    // For competitor search errors, provide a more user-friendly message
    if (endpoint === '/api/competitor/find') {
      if (error instanceof Error && error.message.includes("500")) {
        throw new Error("We had trouble searching for competitors. There might be an issue with the search service.");
      }
    }
    
    // Throw a clear error message
    throw new Error("We can't communicate with our backend services right now. Please ensure the backend server is running.");
  }
}

/**
 * Color analysis API endpoints
 */
export const colorAPI = {
  generatePalette: async (baseColor: string, type: string) => {
    return apiFetch('/api/extract-colors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: baseColor,
        colorCount: 5,
        paletteType: type
      }),
    });
  },
  
  extractFromWebsite: async (url: string) => {
    return apiFetch('/api/extract-from-website', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
  },
  
  healthCheck: async () => {
    return apiFetch('/health');
  }
};

/**
 * Competitor analysis API endpoints
 * Uses OpenAI's web search capabilities via the Python backend for more robust competitor analysis
 */
export const competitorAPI = {
  /**
   * Analyze a competitor website using OpenAI web search
   */
  analyzeWebsite: async (url: string, industry: string = '') => {
    // Call Python backend directly
    return pythonApiFetch('/api/competitor/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, industry }),
    });
  },

  /**
   * Find competitors based on the complete business info collected from the user
   * Uses all business facts to find more accurate competitors via OpenAI web search
   */
  findCompetitors: async (businessInfo: Record<string, string | string[]>) => {
    console.log(`Finding competitors based on collected business information`);
    
    // Extract industry and business description from businessInfo
    const industry = 
      typeof businessInfo.industry === 'string' ? businessInfo.industry : 
      typeof businessInfo.businessType === 'string' ? businessInfo.businessType : 
      typeof businessInfo.businessNature === 'string' ? businessInfo.businessNature : 
      'business';
    
    // Create a business description from all collected facts
    const businessDescription = Object.entries(businessInfo)
      .map(([key, value]) => {
        // Format the key for better readability
        const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
        
        // Handle array values
        if (Array.isArray(value)) {
          return `${formattedKey}: ${value.join(', ')}`;
        }
        return `${formattedKey}: ${value}`;
      })
      .join('. ');
    
    console.log('Calling competitor API with parameters:', {
      businessDescription,
      industry
    });
    
    // Call the Next.js API route (which now forwards to Cloud Run)
    return pythonApiFetch('/api/competitor/find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        businessDescription,
        industry,
        businessInfo // Include original businessInfo for backward compatibility
      }),
    });
  },

  /**
   * Get analysis status of ongoing competitor analysis jobs
   */
  getAnalysisStatus: async (jobIds: string[]) => {
    console.log(`Checking status for jobs: ${jobIds.join(', ')} using Python backend`);
    
    // Call Python backend directly
    return pythonApiFetch('/api/competitor/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobIds }),
    });
  }
};

export default {
  colorAPI,
  competitorAPI
}; 