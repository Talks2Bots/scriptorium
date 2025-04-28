import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cazsmrnnttyajfoojxli.supabase.co'; // TODO: Replace with your Supabase project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhenNtcm5udHR5YWpmb29qeGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NjUwMzMsImV4cCI6MjA2MTQ0MTAzM30.cbgZwiZAPABy2av-OgGiMyFvFvPxSLsdRk0HflunZgI'; // TODO: Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 