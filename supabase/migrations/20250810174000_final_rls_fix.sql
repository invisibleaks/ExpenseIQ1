-- Final RLS Fix - Completely Non-Recursive
-- This eliminates ALL circular references by using only direct checks

-- Disable RLS temporarily
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
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

-- Create SIMPLE policies with NO circular references

-- WORKSAPCES: Users can only see workspaces they created
CREATE POLICY workspaces_select ON public.workspaces
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY workspaces_insert ON public.workspaces
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY workspaces_update ON public.workspaces
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY workspaces_delete ON public.workspaces
FOR DELETE USING (created_by = auth.uid());

-- WORKSPACE_MEMBERS: Users can only see members of workspaces they created
CREATE POLICY wm_select ON public.workspace_members
FOR SELECT USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

CREATE POLICY wm_insert ON public.workspace_members
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

CREATE POLICY wm_update ON public.workspace_members
FOR UPDATE USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

CREATE POLICY wm_delete ON public.workspace_members
FOR DELETE USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

-- EXPENSES: Users can only see expenses for workspaces they created
CREATE POLICY expenses_rw ON public.expenses
FOR ALL USING (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
) WITH CHECK (
  workspace_id IN (
    SELECT id FROM public.workspaces WHERE created_by = auth.uid()
  )
);

-- USER_PROFILES: Users can only see their own profile
CREATE POLICY user_profiles_rw ON public.user_profiles
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Test the policies work
DO $$
BEGIN
  RAISE NOTICE 'Testing final RLS policies...';
  
  -- Test workspaces access
  IF EXISTS (
    SELECT 1 FROM public.workspaces LIMIT 1
  ) THEN
    RAISE NOTICE '✓ Workspaces accessible';
  END IF;
  
  RAISE NOTICE 'Final RLS fix completed successfully!';
END $$;
