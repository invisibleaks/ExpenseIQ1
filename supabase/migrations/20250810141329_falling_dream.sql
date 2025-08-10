/*
  # Create Complete Expenses Table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, required for scoping)
      - `user_id` (uuid, required)
      - `source` (text, enum: upload/camera/voice/manual)
      - `status` (text, enum: unreviewed/reviewed/flagged)
      - `txn_date` (date)
      - `merchant` (text)
      - `amount` (numeric with 2 decimal places)
      - `currency` (text, default INR)
      - `category_id` (uuid, nullable)
      - `category_confidence` (numeric, 0-1 scale)
      - `category_source` (text, enum: ai/rule/user)
      - `payment_method_id` (uuid, nullable)
      - `payment_method_source` (text, enum)
      - `payment_method_confidence` (numeric, 0-1 scale)
      - `notes` (text)
      - `is_reimbursable` (boolean, default false)
      - `created_at` (timestamptz, auto-generated)

  2. Indexes
    - Performance index for workspace/status/date queries

  3. Security
    - Enable RLS on expenses table
    - Add policies for workspace-based access control

  4. Constraints
    - Check constraints for enum fields
    - Foreign key constraints (if referenced tables exist)
*/

-- Create expenses table with all necessary columns
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
  category_confidence numeric(3,2) CHECK (category_confidence >= 0 AND category_confidence <= 1),
  category_source text CHECK (category_source IN ('ai', 'rule', 'user')),
  payment_method_id uuid,
  payment_method_source text CHECK (payment_method_source IN ('ocr', 'last_used_merchant', 'workspace_default', 'user')),
  payment_method_confidence numeric(3,2) CHECK (payment_method_confidence >= 0 AND payment_method_confidence <= 1),
  notes text,
  is_reimbursable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create performance index for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_ws_status_date 
ON public.expenses (workspace_id, status, txn_date DESC);

-- Create additional useful indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id 
ON public.expenses (user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_merchant 
ON public.expenses (merchant);

CREATE INDEX IF NOT EXISTS idx_expenses_amount 
ON public.expenses (amount);

-- Add foreign key constraints if referenced tables exist
DO $$
BEGIN
  -- Add workspace_id foreign key if workspaces table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'expenses_workspace_id_fkey' 
      AND table_name = 'expenses'
    ) THEN
      ALTER TABLE public.expenses 
      ADD CONSTRAINT expenses_workspace_id_fkey 
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Add user_id foreign key to auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_user_id_fkey' 
    AND table_name = 'expenses'
  ) THEN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT expenses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add category_id foreign key if categories table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'expenses_category_id_fkey' 
      AND table_name = 'expenses'
    ) THEN
      ALTER TABLE public.expenses 
      ADD CONSTRAINT expenses_category_id_fkey 
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add payment_method_id foreign key if payment_methods table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'expenses_payment_method_id_fkey' 
      AND table_name = 'expenses'
    ) THEN
      ALTER TABLE public.expenses 
      ADD CONSTRAINT expenses_payment_method_id_fkey 
      FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workspace-based access
-- Note: These policies assume workspace_members table exists for membership checking

-- Policy for SELECT: Users can read expenses from workspaces they're members of
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

-- Policy for INSERT: Users can create expenses in workspaces they're members of
CREATE POLICY "Users can create expenses in their workspaces"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = expenses.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy for UPDATE: Users can update their own expenses in their workspaces
CREATE POLICY "Users can update their own expenses in their workspaces"
ON public.expenses
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = expenses.workspace_id
    AND wm.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = expenses.workspace_id
    AND wm.user_id = auth.uid()
  )
);

-- Policy for DELETE: Users can delete their own expenses in their workspaces
CREATE POLICY "Users can delete their own expenses in their workspaces"
ON public.expenses
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = expenses.workspace_id
    AND wm.user_id = auth.uid()
  )
);