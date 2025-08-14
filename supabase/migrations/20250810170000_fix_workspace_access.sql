/*
  # Fix workspace access for new users

  1. Problem
    - New users can't see any workspaces because RLS requires membership
    - This creates a chicken-and-egg problem for workspace creation
    - Seed helper in previous migration isn't working properly

  2. Solution
    - Allow users to see workspaces they created (created_by = auth.uid())
    - Create a function to automatically create default workspace for new users
    - Ensure proper workspace membership is created

  3. Security
    - Users can only see workspaces they created or are members of
    - No change to security model, just fixes the access issue
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS workspaces_select ON public.workspaces;

-- Create a better policy that allows users to see workspaces they created
CREATE POLICY workspaces_select ON public.workspaces
FOR SELECT USING (
  created_by = auth.uid() OR
  exists (select 1 from public.workspace_members m
          where m.workspace_id = workspaces.id and m.user_id = auth.uid())
);

-- Create a function to ensure new users have a default workspace
CREATE OR REPLACE FUNCTION public.ensure_default_workspace()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ws_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user already has a workspace
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE created_by = current_user_id
  ) THEN
    -- Create default workspace
    INSERT INTO public.workspaces (id, name, created_by)
    VALUES (gen_random_uuid(), 'My Business', current_user_id)
    RETURNING id INTO ws_id;
    
    -- Create workspace membership
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, current_user_id, 'owner');
    
    RAISE NOTICE 'Created default workspace % for user %', ws_id, current_user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_default_workspace() TO authenticated;

-- Create a trigger to automatically call this function
CREATE OR REPLACE FUNCTION public.trigger_ensure_default_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_default_workspace();
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table (if possible) or create a manual call
-- Note: We can't create triggers on auth.users directly, so we'll call this manually

-- Add a comment explaining how to use this
COMMENT ON FUNCTION public.ensure_default_workspace() IS 
'Call this function after user signup to ensure they have a default workspace. 
Example: SELECT public.ensure_default_workspace();';
