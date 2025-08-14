-- Add missing categories and payment_methods tables
-- This migration creates the tables that are referenced in the expenses table

-- 1) Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6', -- Default blue color
  icon text DEFAULT 'tag', -- Default icon
  is_default boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique category names per workspace
  UNIQUE(workspace_id, name)
);

-- 2) Payment Methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('card', 'cash', 'bank', 'digital', 'other')),
  last_four text, -- For cards: last 4 digits
  bank_name text, -- For bank transfers
  is_default boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique payment method names per workspace
  UNIQUE(workspace_id, name)
);

-- 3) Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_workspace ON public.categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON public.categories(created_by);
CREATE INDEX IF NOT EXISTS idx_payment_methods_workspace ON public.payment_methods(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_created_by ON public.payment_methods(created_by);

-- 4) Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 5) Create RLS policies for categories
CREATE POLICY categories_rw ON public.categories
FOR ALL USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
) WITH CHECK (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

-- 6) Create RLS policies for payment methods
CREATE POLICY payment_methods_rw ON public.payment_methods
FOR ALL USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
) WITH CHECK (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

-- 7) Insert some default categories for new workspaces
-- This function will be called when a new workspace is created
CREATE OR REPLACE FUNCTION public.create_default_categories(workspace_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.categories (workspace_id, name, description, color, icon, is_default, created_by)
  VALUES
    (workspace_uuid, 'Food & Dining', 'Restaurants, groceries, and food delivery', '#EF4444', 'utensils', true, auth.uid()),
    (workspace_uuid, 'Transportation', 'Fuel, public transport, ride-sharing', '#3B82F6', 'car', true, auth.uid()),
    (workspace_uuid, 'Office Supplies', 'Stationery, equipment, and office expenses', '#10B981', 'briefcase', true, auth.uid()),
    (workspace_uuid, 'Utilities', 'Electricity, water, internet, phone bills', '#F59E0B', 'zap', true, auth.uid()),
    (workspace_uuid, 'Entertainment', 'Movies, games, and leisure activities', '#8B5CF6', 'music', true, auth.uid()),
    (workspace_uuid, 'Healthcare', 'Medical expenses and health-related costs', '#EC4899', 'heart', true, auth.uid()),
    (workspace_uuid, 'Travel', 'Flights, hotels, and travel expenses', '#06B6D4', 'plane', true, auth.uid()),
    (workspace_uuid, 'Other', 'Miscellaneous expenses', '#6B7280', 'more-horizontal', true, auth.uid())
  ON CONFLICT (workspace_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Insert some default payment methods for new workspaces
CREATE OR REPLACE FUNCTION public.create_default_payment_methods(workspace_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO public.payment_methods (workspace_id, name, description, type, is_default, created_by)
  VALUES
    (workspace_uuid, 'Cash', 'Physical cash payments', 'cash', true, auth.uid()),
    (workspace_uuid, 'Credit Card', 'Credit card payments', 'card', true, auth.uid()),
    (workspace_uuid, 'Debit Card', 'Debit card payments', 'card', true, auth.uid()),
    (workspace_uuid, 'Bank Transfer', 'Direct bank transfers', 'bank', true, auth.uid()),
    (workspace_uuid, 'Digital Wallet', 'UPI, Paytm, etc.', 'digital', true, auth.uid())
  ON CONFLICT (workspace_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Update the workspace creation trigger to also create default categories and payment methods
-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a new, enhanced trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  ws_id uuid;
BEGIN
  -- Create default workspace
  INSERT INTO public.workspaces (id, name, description, business_type, created_by)
  VALUES (gen_random_uuid(), 'My Business', 'Default workspace for new user', 'Freelancer', NEW.id)
  RETURNING id INTO ws_id;

  -- Add user as workspace member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner');

  -- Create default categories
  PERFORM public.create_default_categories(ws_id);

  -- Create default payment methods
  PERFORM public.create_default_payment_methods(ws_id);

  -- Create user profile
  INSERT INTO public.user_profiles (user_id, full_name, business_type, company_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'business_type', NEW.raw_user_meta_data->>'company_name')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10) Test the setup
DO $$
BEGIN
  RAISE NOTICE 'Categories and Payment Methods tables created successfully!';
  RAISE NOTICE 'Default categories and payment methods will be created for new users.';
  RAISE NOTICE 'Existing users can manually create categories and payment methods.';
END $$;
