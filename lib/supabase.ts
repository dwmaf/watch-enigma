import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Env Variables! You need to restart your Next.js server.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
