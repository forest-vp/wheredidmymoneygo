-- WDMG Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount DECIMAL(10, 2) NOT NULL,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Reports table
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT DEFAULT 'weekly' CHECK (report_type IN ('weekly', 'monthly')),
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Expenses policies
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- AI Reports policies
CREATE POLICY "Users can view own reports" ON ai_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON ai_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
