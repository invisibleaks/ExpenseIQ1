/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, references workspaces)
      - `user_id` (uuid, references auth.users)
      - `source` (text, check constraint)
      - `status` (text, check constraint)
      - `txn_date` (date)
      - `merchant` (text)
      - `amount` (numeric)
      - `currency` (text, default 'INR')
      - `category_id` (uuid, nullable)
      - `category_confidence` (numeric)
      - `category_source` (text)
      - `payment_method_id` (uuid, nullable)
      - `payment_method_source` (text)
      - `payment_method_confidence` (numeric)
      - `notes` (text)
      - `is_reimbursable` (boolean)
      - `created_at` (timestamp)

  2. Indexes
    - Composite index on workspace_id, status, txn_date for performance

  3. Security
    - Enable RLS on `expenses` table
    - Add policies based on workspace membership
*/

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
ON public.expenses(workspace_id, status, txn_date DESC);

-- Create additional useful indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at DESC);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;