-- Add User Profiles Table
-- This migration creates a proper table to store user profile information
-- including business type, making it queryable and accessible

-- 1) Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- 2) Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_type ON public.user_profiles(business_type);

-- 3) Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4) Create RLS policies
-- Users can see their own profile
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY user_profiles_insert ON public.user_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY user_profiles_update ON public.user_profiles
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own profile
CREATE POLICY user_profiles_delete ON public.user_profiles
FOR DELETE USING (user_id = auth.uid());

-- 5) Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract user metadata from auth.users
  INSERT INTO public.user_profiles (
    user_id,
    full_name,
    business_type
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'business_type', 'other')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) Create function to get current user's profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  business_type TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.full_name,
    up.business_type,
    up.avatar_url,
    up.phone,
    up.company_name,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up
  WHERE up.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 8) Create function to update user profile
CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  business_type TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    full_name = COALESCE(p_full_name, full_name),
    business_type = COALESCE(p_business_type, business_type),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    phone = COALESCE(p_phone, phone),
    company_name = COALESCE(p_company_name, company_name),
    updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN QUERY
  SELECT * FROM public.get_my_profile();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 9) Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Stores user profile information including business type and personal details';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user signs up';
COMMENT ON FUNCTION public.get_my_profile() IS 'Returns the current user''s profile information';
COMMENT ON FUNCTION public.update_my_profile(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Updates the current user''s profile information';
