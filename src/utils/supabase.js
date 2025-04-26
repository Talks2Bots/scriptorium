import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with proper error handling
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Log configuration for debugging
console.log('Supabase configuration:', {
  urlConfigured: !!supabaseUrl,
  keyConfigured: !!supabaseAnonKey,
});

// Create a fallback for development if env vars are not set
const fallbackUrl = 'https://your-project-id.supabase.co'; // Replace with your actual URL in production
const fallbackKey = 'public-anon-key'; // Replace with your actual key in production

const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

let supabase;
try {
  supabase = createClient(finalUrl, finalKey);
  console.log('Supabase client initialized');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a mock client for fallback
  supabase = {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    }),
    storage: {
      from: () => ({
        getPublicUrl: () => ({ publicURL: '' })
      })
    }
  };
}

// Function to fetch all objects from Supabase
export const fetchObjects = async () => {
  try {
    console.log('Fetching objects from Supabase');
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching objects:', error);
    throw new Error(`Failed to fetch objects: ${error.message}`);
  }
};

// Function to get image URL from Supabase Storage
export const getImageUrl = (path) => {
  if (!path) return '';
  
  try {
    const { publicURL } = supabase
      .storage
      .from('scriptorium-images')
      .getPublicUrl(path);
    
    return publicURL;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return '';
  }
};

export default supabase; 