import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERROR: Supabase environment variables are not set! Please create a .env file with the following variables:\n" +
    "REACT_APP_SUPABASE_URL=your-supabase-url\n" +
    "REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key"
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
); 