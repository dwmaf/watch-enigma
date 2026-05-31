-- Run this in your Supabase SQL Editor

CREATE TABLE watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'film' or 'series'
  status TEXT NOT NULL, -- 'plan-to-watch', 'watching', 'completed', 'on-hold', 'dropped'
  total_episodes INTEGER,
  watched_episodes INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  links JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
