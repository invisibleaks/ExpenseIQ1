/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key, auto-generated)
      - `workspace_id` (uuid, required for scoping)
      - `user_id` (uuid, required)
      - `source` (text, constrained to specific values)
      - `status` (text, constrained, defaults to 'unreviewed')
      - `txn_date` (date)
      - `merchant` (text)
      - `amount` (numeric with precision)
      - `currency` (text, defaults to 'INR')
      - `category_id` (uuid, nullable)
      - `category_confidence` (numeric)
      - `category_source` (text, constrained)
      - `payment_method_id` (uuid, nullable)
      - `payment_method_source` (text, constrained)
      - `payment_method_confidence` (numeric)
      - `notes` (text)
      - `is_reimbursable` (boolean, defaults to false)
      - `created_at` (timestamptz, defaults to now())

  2. Security
    - Enable RLS on `expenses` table
    - Add policies for workspace-based access control
    - Users can only access expenses from their workspaces

  3. Performance
    - Add composite index for workspace_id, status, and txn_date

  4. Data Integrity
    - Add foreign key constraints to related tables
    - Add check constraints for enum-like fields
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_expenses_ws_status_date 
ON public.expenses (workspace_id, status, txn_date DESC);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace-based access

-- Policy for SELECT: Users can view expenses from workspaces they're members of
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

-- Policy for INSERT: Users can create expenses in their workspaces
CREATE POLICY "Users can create expenses in their workspaces"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for UPDATE: Users can update their own expenses in their workspaces
CREATE POLICY "Users can update their own expenses in their workspaces"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy for DELETE: Users can delete their own expenses in their workspaces
CREATE POLICY "Users can delete their own expenses in their workspaces"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add foreign key constraints (these will only be added if the referenced tables exist)

-- Add foreign key to workspaces table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_workspace_id 
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key to auth.users
ALTER TABLE public.expenses 
ADD CONSTRAINT fk_expenses_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key to categories table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_category_id 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key to payment_methods table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_payment_method_id 
    FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;
  END IF;
END $$;