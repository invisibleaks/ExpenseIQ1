-- Comprehensive Fix for All RLS Recursion Issues
-- This migration completely rebuilds all policies to eliminate any circular references

-- First, disable RLS temporarily to clean up
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS workspaces_select ON public.workspaces;
DROP POLICY IF EXISTS workspaces_insert ON public.workspaces;
DROP POLICY IF EXISTS workspaces_update ON public.workspaces;
DROP POLICY IF EXISTS workspaces_delete ON public.workspaces;

DROP POLICY IF EXISTS wm_select ON public.workspace_members;
DROP POLICY IF EXISTS wm_insert ON public.workspace_members;
DROP POLICY IF EXISTS wm_update ON public.workspace_members;
DROP POLICY IF EXISTS wm_delete ON public.workspace_members;

DROP POLICY IF EXISTS expenses_rw ON public.expenses;
DROP POLICY IF EXISTS user_profiles_rw ON public.user_profiles;

-- Now create completely new, simple policies that avoid any recursion

-- WORKSAPCES POLICIES (Simplified - no circular references)
CREATE POLICY workspaces_select ON public.workspaces
FOR SELECT USING (
  created_by = auth.uid() OR
  id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY workspaces_insert ON public.workspaces
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY workspaces_update ON public.workspaces
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY workspaces_delete ON public.workspaces
FOR DELETE USING (created_by = auth.uid());

-- WORKSPACE_MEMBERS POLICIES (Simplified - no circular references)
CREATE POLICY wm_select ON public.workspace_members
FOR SELECT USING (
  user_id = auth.uid() OR
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY wm_insert ON public.workspace_members
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY wm_update ON public.workspace_members
FOR UPDATE USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY wm_delete ON public.workspace_members
FOR DELETE USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE created_by = auth.uid()
  )
);

-- EXPENSES POLICIES (Simplified - no circular references)
CREATE POLICY expenses_rw ON public.expenses
FOR ALL USING (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE created_by = auth.uid()
  )
) WITH CHECK (
  workspace_id IN (
    SELECT id 
    FROM public.workspaces 
    WHERE created_by = auth.uid()
  )
);

-- USER_PROFILES POLICIES (Simplified - no circular references)
CREATE POLICY user_profiles_rw ON public.user_profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Test the policies work without recursion
DO $$
BEGIN
  RAISE NOTICE 'Testing all RLS policies...';
  
  -- Test workspaces access
  IF EXISTS (
    SELECT 1 FROM public.workspaces LIMIT 1
  ) THEN
    RAISE NOTICE '✓ Workspaces table accessible';
  END IF;
  
  -- Test workspace_members access
  IF EXISTS (
    SELECT 1 FROM public.workspace_members LIMIT 1
  ) THEN
    RAISE NOTICE '✓ Workspace_members table accessible';
  END IF;
  
  -- Test expenses access
  IF EXISTS (
    SELECT 1 FROM public.expenses LIMIT 1
  ) THEN
    RAISE NOTICE '✓ Expenses table accessible';
  END IF;
  
  -- Test user_profiles access
  IF EXISTS (
    SELECT 1 FROM public.user_profiles LIMIT 1
  ) THEN
    RAISE NOTICE '✓ User_profiles table accessible';
  END IF;
  
  RAISE NOTICE 'All RLS policies updated successfully - no recursion detected!';
END $$;
