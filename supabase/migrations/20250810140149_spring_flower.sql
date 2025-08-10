/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key, auto-generated)
      - `workspace_id` (uuid, required for scoping)
      - `user_id` (uuid, required)
      - `source` (text, constrained values)
      - `status` (text, constrained values, default 'unreviewed')
      - `txn_date` (date)
      - `merchant` (text)
      - `amount` (numeric with precision)
      - `currency` (text, default 'INR')
      - `category_id` (uuid, nullable)
      - `category_confidence` (numeric)
      - `category_source` (text, constrained values)
      - `payment_method_id` (uuid, nullable)
      - `payment_method_source` (text, constrained values)
      - `payment_method_confidence` (numeric)
      - `notes` (text)
      - `is_reimbursable` (boolean, default false)
      - `created_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `expenses` table
    - Add policies for workspace-based access control
    - Users can only access expenses from their workspaces

  3. Performance
    - Add composite index for workspace, status, and date queries

  4. Data Integrity
    - Add foreign key constraints to related tables (if they exist)
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create expenses table
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

-- Create index for efficient workspace-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_ws_status_date 
ON public.expenses (workspace_id, status, txn_date DESC);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

CREATE POLICY "Users can insert expenses in their workspaces"
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

CREATE POLICY "Users can update their own expenses in their workspaces"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own expenses in their workspaces"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add foreign key constraints (only if referenced tables exist)
DO $$
BEGIN
  -- Add workspace_id foreign key if workspaces table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_workspace_id 
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
  END IF;

  -- Add user_id foreign key to auth.users
  ALTER TABLE public.expenses 
  ADD CONSTRAINT fk_expenses_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  -- Add category_id foreign key if categories table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_category_id 
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;

  -- Add payment_method_id foreign key if payment_methods table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT fk_expenses_payment_method_id 
    FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;
  END IF;
END $$;