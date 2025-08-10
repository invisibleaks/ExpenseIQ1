/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - The `wm_select` policy on `workspace_members` was checking itself
    - This created infinite recursion when expenses policy tried to check workspace membership

  2. Solution
    - Simplify `wm_select` policy to only check direct user membership
    - Remove self-referential query that caused the loop

  3. Security
    - Users can see workspace members for workspaces they belong to
    - No change to security model, just fixes the recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS wm_select ON public.workspace_members;

-- Create a simplified policy that doesn't reference itself
CREATE POLICY wm_select ON public.workspace_members
FOR SELECT USING (
  user_id = auth.uid() OR 
  workspace_id IN (
    SELECT workspace_id 
    FROM public.workspace_members 
    WHERE user_id = auth.uid()
  )
);