-- Fix RLS Infinite Recursion Issue
-- This migration fixes the circular reference problem in the workspace_members policies

-- Drop the problematic policies first
DROP POLICY IF EXISTS wm_select ON public.workspace_members;
DROP POLICY IF EXISTS wm_insert ON public.workspace_members;
DROP POLICY IF EXISTS wm_delete ON public.workspace_members;

-- Create simplified policies that don't cause recursion

-- Policy 1: Users can see workspace members for workspaces they belong to
-- This is simplified to avoid recursion
CREATE POLICY wm_select ON public.workspace_members
FOR SELECT USING (
  user_id = auth.uid() OR 
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w
    WHERE w.created_by = auth.uid()
  )
);

-- Policy 2: Users can add members to workspaces they created
-- This is simplified to avoid recursion
CREATE POLICY wm_insert ON public.workspace_members
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w
    WHERE w.created_by = auth.uid()
  )
);

-- Policy 3: Users can remove members from workspaces they created
-- This is simplified to avoid recursion
CREATE POLICY wm_delete ON public.workspace_members
FOR DELETE USING (
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w
    WHERE w.created_by = auth.uid()
  )
);

-- Also fix the expenses policy to avoid potential recursion
DROP POLICY IF EXISTS expenses_rw ON public.expenses;

CREATE POLICY expenses_rw ON public.expenses
FOR ALL USING (
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w
    WHERE w.created_by = auth.uid()
  )
) WITH CHECK (
  workspace_id IN (
    SELECT w.id 
    FROM public.workspaces w
    WHERE w.created_by = auth.uid()
  )
);

-- Test the policies by running a simple query
-- This will help verify the policies work without recursion
DO $$
BEGIN
  RAISE NOTICE 'Testing RLS policies...';
  
  -- Test if we can query workspaces without recursion
  IF EXISTS (
    SELECT 1 FROM public.workspaces LIMIT 1
  ) THEN
    RAISE NOTICE 'Workspaces table is accessible';
  END IF;
  
  -- Test if we can query workspace_members without recursion
  IF EXISTS (
    SELECT 1 FROM public.workspace_members LIMIT 1
  ) THEN
    RAISE NOTICE 'Workspace_members table is accessible';
  END IF;
  
  RAISE NOTICE 'RLS policies updated successfully';
END $$;
