import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch all objects from Supabase
export const fetchObjects = async () => {
  try {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('id');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching objects:', error);
    return [];
  }
};

// Function to get image URL from Supabase Storage
export const getImageUrl = (path) => {
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