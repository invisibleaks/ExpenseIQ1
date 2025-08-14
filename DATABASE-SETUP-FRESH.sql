-- =====================================================
-- FRESH DATABASE SETUP FOR EXPENSE IQ
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE CORE TABLES
-- =====================================================

-- Workspaces table (businesses)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    business_type TEXT DEFAULT 'business',
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    business_type TEXT,
    phone TEXT,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'tag',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'card',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'upload', 'camera', 'voice')),
    status TEXT DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'reviewed', 'flagged')),
    txn_date DATE NOT NULL,
    merchant TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_confidence DECIMAL(3,2) CHECK (category_confidence >= 0 AND category_confidence <= 1),
    category_source TEXT DEFAULT 'manual' CHECK (category_source IN ('manual', 'ai')),
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    payment_method_source TEXT DEFAULT 'manual' CHECK (payment_method_source IN ('manual', 'ai')),
    payment_method_confidence DECIMAL(3,2) CHECK (payment_method_confidence >= 0 AND payment_method_confidence <= 1),
    notes TEXT,
    is_reimbursable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON public.workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspaces_name ON public.workspaces(name);

-- Workspace members indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_workspace_id ON public.categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON public.categories(created_by);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_workspace_id ON public.payment_methods(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_created_by ON public.payment_methods(created_by);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_workspace_id ON public.expenses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_txn_date ON public.expenses(txn_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method_id ON public.expenses(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- =====================================================
-- 3. CREATE FUNCTIONS
-- =====================================================

-- Function to create default categories for a workspace
CREATE OR REPLACE FUNCTION public.create_default_categories(workspace_uuid uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.categories (workspace_id, name, description, color, icon, created_by) VALUES
        (workspace_uuid, 'Food & Dining', 'Restaurants, cafes, and food delivery', '#EF4444', 'utensils', workspace_uuid),
        (workspace_uuid, 'Transportation', 'Uber, taxis, fuel, and public transport', '#3B82F6', 'car', workspace_uuid),
        (workspace_uuid, 'Office Supplies', 'Stationery, equipment, and office materials', '#10B981', 'briefcase', workspace_uuid),
        (workspace_uuid, 'Software & Subscriptions', 'SaaS tools, apps, and online services', '#8B5CF6', 'monitor', workspace_uuid),
        (workspace_uuid, 'Marketing & Advertising', 'Ads, promotions, and marketing materials', '#F59E0B', 'megaphone', workspace_uuid),
        (workspace_uuid, 'Travel', 'Flights, hotels, and business travel', '#06B6D4', 'plane', workspace_uuid),
        (workspace_uuid, 'Utilities', 'Electricity, internet, and phone bills', '#84CC16', 'zap', workspace_uuid),
        (workspace_uuid, 'Insurance', 'Business insurance and liability coverage', '#F97316', 'shield', workspace_uuid),
        (workspace_uuid, 'Professional Services', 'Legal, accounting, and consulting fees', '#EC4899', 'users', workspace_uuid),
        (workspace_uuid, 'Other', 'Miscellaneous expenses', '#6B7280', 'more-horizontal', workspace_uuid)
    ON CONFLICT (workspace_id, name) DO NOTHING;
    
    RAISE NOTICE 'Created default categories for workspace: %', workspace_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default payment methods for a workspace
CREATE OR REPLACE FUNCTION public.create_default_payment_methods(workspace_uuid uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.payment_methods (workspace_id, name, description, type, created_by) VALUES
        (workspace_uuid, 'Credit Card', 'Business credit card', 'card', workspace_uuid),
        (workspace_uuid, 'Debit Card', 'Business debit card', 'card', workspace_uuid),
        (workspace_uuid, 'Cash', 'Physical cash payments', 'cash', workspace_uuid),
        (workspace_uuid, 'Bank Transfer', 'Direct bank transfers', 'transfer', workspace_uuid),
        (workspace_uuid, 'UPI', 'Unified Payment Interface', 'upi', workspace_uuid),
        (workspace_uuid, 'Digital Wallet', 'Paytm, PhonePe, etc.', 'wallet', workspace_uuid)
    ON CONFLICT (workspace_id, name) DO NOTHING;
    
    RAISE NOTICE 'Created default payment methods for workspace: %', workspace_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_workspace_id uuid;
BEGIN
    -- Create a default workspace for the new user
    INSERT INTO public.workspaces (name, business_type, description, created_by)
    VALUES ('My Business', 'business', 'Default workspace for new user', NEW.id)
    RETURNING id INTO new_workspace_id;
    
    -- Add user as owner of the workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, NEW.id, 'owner');
    
    -- Create user profile
    INSERT INTO public.user_profiles (user_id, full_name, business_type)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
            COALESCE(NEW.raw_user_meta_data->>'business_type', 'business'));
    
    -- Create default categories and payment methods
    PERFORM public.create_default_categories(new_workspace_id);
    PERFORM public.create_default_payment_methods(new_workspace_id);
    
    RAISE NOTICE 'Created default workspace and data for new user: %', NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger to handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Workspaces policies
CREATE POLICY workspaces_select ON public.workspaces
    FOR SELECT USING (
        created_by = auth.uid() OR 
        id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY workspaces_insert ON public.workspaces
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY workspaces_update ON public.workspaces
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY workspaces_delete ON public.workspaces
    FOR DELETE USING (created_by = auth.uid());

-- Workspace members policies
CREATE POLICY wm_select ON public.workspace_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
    );

CREATE POLICY wm_insert ON public.workspace_members
    FOR INSERT WITH CHECK (
        workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
    );

CREATE POLICY wm_update ON public.workspace_members
    FOR UPDATE USING (
        workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
    );

CREATE POLICY wm_delete ON public.workspace_members
    FOR DELETE USING (
        workspace_id IN (SELECT id FROM public.workspaces WHERE created_by = auth.uid())
    );

-- User profiles policies
CREATE POLICY user_profiles_rw ON public.user_profiles
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Categories policies
CREATE POLICY categories_rw ON public.categories
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces 
            WHERE created_by = auth.uid() OR 
                  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces 
            WHERE created_by = auth.uid() OR 
                  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

-- Payment methods policies
CREATE POLICY payment_methods_rw ON public.payment_methods
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces 
            WHERE created_by = auth.uid() OR 
                  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces 
            WHERE created_by = auth.uid() OR 
                  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

-- Expenses policies
CREATE POLICY expenses_rw ON public.expenses
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM public.workspaces 
            WHERE created_by = auth.uid() OR 
                  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces 
            WHERE created_by = auth.uid() OR 
                  id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
    );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT ALL ON public.workspaces TO anon, authenticated;
GRANT ALL ON public.workspace_members TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.categories TO anon, authenticated;
GRANT ALL ON public.payment_methods TO anon, authenticated;
GRANT ALL ON public.expenses TO anon, authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Check if tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SETUP COMPLETE! 🎉
-- =====================================================

-- Your database is now ready for Expense IQ!
-- The system will automatically:
-- 1. Create a default workspace for new users
-- 2. Set up default categories and payment methods
-- 3. Apply proper security policies
-- 4. Handle user authentication and workspace management

-- Next steps:
-- 1. Sign up a new user in your app
-- 2. The system will automatically create their workspace
-- 3. You can then add expenses and test the dashboard
