/*
  # Create RLS policies for expenses table

  1. Security Policies
    - Users can read expenses from workspaces they are members of
    - Users can create expenses in workspaces they are members of
    - Users can update their own expenses in workspaces they are members of
    - Users can delete their own expenses in workspaces they are members of
*/

-- RLS Policies for expenses table

-- SELECT: Users can read expenses from workspaces they are members of
CREATE POLICY "Users can read expenses from their workspaces"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = expenses.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- INSERT: Users can create expenses in workspaces they are members of
CREATE POLICY "Users can create expenses in their workspaces"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = expenses.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update their own expenses in workspaces they are members of
CREATE POLICY "Users can update their own expenses in their workspaces"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = expenses.workspace_id
      AND wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = expenses.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete their own expenses in workspaces they are members of
CREATE POLICY "Users can delete their own expenses in their workspaces"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = expenses.workspace_id
      AND wm.user_id = auth.uid()
    )
  );