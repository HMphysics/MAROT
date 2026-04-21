import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klkyfbcolenumdnjpigz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsa3lmYmNvbGVudW1kbmpwaWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NzE0NzMsImV4cCI6MjA3NTU0NzQ3M30.fh8tDHWTiKaqSaE0f3bd-sRDLhY1Y4fqSUlljLcz93k';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
