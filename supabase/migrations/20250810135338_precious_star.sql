/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key, auto-generated)
      - `workspace_id` (uuid, required for scoping)
      - `user_id` (uuid, required)
      - `source` (text, constrained to upload/camera/voice/manual)
      - `status` (text, constrained to unreviewed/reviewed/flagged, defaults to unreviewed)
      - `txn_date` (date, transaction date)
      - `merchant` (text, merchant name)
      - `amount` (numeric, up to 12 digits with 2 decimal places)
      - `currency` (text, defaults to INR)
      - `category_id` (uuid, nullable, references categories)
      - `category_confidence` (numeric, 0-1 scale with 2 decimal places)
      - `category_source` (text, ai/rule/user)
      - `payment_method_id` (uuid, nullable, references payment_methods)
      - `payment_method_source` (text, ocr/last_used_merchant/workspace_default/user)
      - `payment_method_confidence` (numeric, 0-1 scale with 2 decimal places)
      - `notes` (text, optional notes)
      - `is_reimbursable` (boolean, defaults to false)
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `expenses` table
    - Add policies for workspace members to manage their expenses
    - Only users who are members of the workspace can access expenses

  3. Indexes
    - Composite index on workspace_id, status, and txn_date (descending) for efficient filtering

  4. Foreign Keys
    - workspace_id → public.workspaces(id) (if workspaces table exists)
    - user_id → auth.users(id)
    - category_id → public.categories(id) (if categories table exists)
    - payment_method_id → public.payment_methods(id) (if payment_methods table exists)
*/

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('upload', 'camera', 'voice', 'manual')),
  status text NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'reviewed', 'flagged')),
  txn_date date,
  merchant text,
  amount numeric(12,2),
  currency text DEFAULT 'INR',
  category_id uuid,
  category_confidence numeric(3,2),
  category_source text CHECK (category_source IN ('ai', 'rule', 'user')),
  payment_method_id uuid,
  payment_method_source text CHECK (payment_method_source IN ('ocr', 'last_used_merchant', 'workspace_default', 'user')),
  payment_method_confidence numeric(3,2),
  notes text,
  is_reimbursable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_expenses_ws_status_date 
ON public.expenses (workspace_id, status, txn_date DESC);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace-based access
-- Policy for SELECT: Users can view expenses from workspaces they belong to
CREATE POLICY "Users can view expenses from their workspaces"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for INSERT: Users can create expenses in workspaces they belong to
CREATE POLICY "Users can create expenses in their workspaces"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy for UPDATE: Users can update expenses they created in their workspaces
CREATE POLICY "Users can update their expenses in their workspaces"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy for DELETE: Users can delete expenses they created in their workspaces
CREATE POLICY "Users can delete their expenses in their workspaces"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Add foreign key constraints (only if the referenced tables exist)
-- Check if workspaces table exists and add FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'workspaces'
  ) THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_workspace_id 
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK to auth.users (this should always exist)
ALTER TABLE public.expenses 
ADD CONSTRAINT fk_expenses_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Check if categories table exists and add FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'categories'
  ) THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_category_id 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Check if payment_methods table exists and add FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'payment_methods'
  ) THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_payment_method_id 
    FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;
  END IF;
END $$;