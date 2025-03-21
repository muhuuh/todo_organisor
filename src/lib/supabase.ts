
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// These environment variables will be replaced by the actual values
// when the user connects their Supabase project through Lovable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function for error handling
export const handleSupabaseError = (error: Error | null) => {
  if (error) {
    console.error('Supabase error:', error);
    toast.error('An error occurred. Please try again.');
    return true;
  }
  return false;
};

// Initialize the database schema
export const initializeDatabase = async () => {
  try {
    // Check authentication
    const { data: authData } = await supabase.auth.getSession();
    const isAuthenticated = !!authData.session;

    // Check if tasks table exists
    const { error: checkError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Tasks table does not exist. Please create it in the Supabase dashboard.');
      toast.error('Please create the tasks table in your Supabase dashboard with the required fields.');
      
      // Display the table creation instructions
      console.info(`
        Create a 'tasks' table with the following columns:
        - id: uuid (primary key, default: uuid_generate_v4())
        - user_id: uuid (references auth.users, not null)
        - sub_task: text (not null)
        - main_task: text
        - category: text (not null)
        - importance: text (not null, check: importance in ('Low', 'Medium', 'High'))
        - time_estimate: integer
        - bucket: text (not null, check: bucket in ('Short-Term', 'Mid-Term', 'Long-Term', 'Today', 'Tomorrow', 'This Week'))
        - is_archived: boolean (not null, default: false)
        - created_at: timestamptz (not null, default: now())
        - updated_at: timestamptz (not null, default: now())
      `);
      
      return false;
    } else if (checkError) {
      console.error('Error checking tasks table:', checkError);
      toast.error('Failed to connect to the database');
      return false;
    }
    
    console.log('Successfully connected to Supabase');
    if (isAuthenticated) {
      toast.success('Connected to Supabase database');
    }
    return true;
  } catch (err) {
    console.error('Failed to initialize database:', err);
    toast.error('Failed to connect to the database');
    return false;
  }
};

// Function to check authentication status
export const checkAuthStatus = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Auth error:', error);
    return null;
  }
  return data.session;
};

// Function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    toast.error('Failed to sign out. Please try again.');
    return false;
  }
  
  toast.success('Signed out successfully');
  return true;
};
