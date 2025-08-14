-- Fix existing users by adding default categories and payment methods
-- This migration ensures existing workspaces have the necessary data

-- 1) First, let's check what workspaces exist and add default data for them
DO $$
DECLARE
  ws RECORD;
BEGIN
  -- Loop through all existing workspaces
  FOR ws IN SELECT id, created_by FROM public.workspaces LOOP
    RAISE NOTICE 'Adding default data for workspace: %', ws.id;
    
    -- Add default categories for this workspace
    INSERT INTO public.categories (workspace_id, name, description, color, icon, is_default, created_by)
    VALUES
      (ws.id, 'Food & Dining', 'Restaurants, groceries, and food delivery', '#EF4444', 'utensils', true, ws.created_by),
      (ws.id, 'Transportation', 'Fuel, public transport, ride-sharing', '#3B82F6', 'car', true, ws.created_by),
      (ws.id, 'Office Supplies', 'Stationery, equipment, and office expenses', '#10B981', 'briefcase', true, ws.created_by),
      (ws.id, 'Utilities', 'Electricity, water, internet, phone bills', '#F59E0B', 'zap', true, ws.created_by),
      (ws.id, 'Entertainment', 'Movies, games, and leisure activities', '#8B5CF6', 'music', true, ws.created_by),
      (ws.id, 'Healthcare', 'Medical expenses and health-related costs', '#EC4899', 'heart', true, ws.created_by),
      (ws.id, 'Travel', 'Flights, hotels, and travel expenses', '#06B6D4', 'plane', true, ws.created_by),
      (ws.id, 'Other', 'Miscellaneous expenses', '#6B7280', 'more-horizontal', true, ws.created_by)
    ON CONFLICT (workspace_id, name) DO NOTHING;
    
    -- Add default payment methods for this workspace
    INSERT INTO public.payment_methods (workspace_id, name, description, type, is_default, created_by)
    VALUES
      (ws.id, 'Cash', 'Physical cash payments', 'cash', true, ws.created_by),
      (ws.id, 'Credit Card', 'Credit card payments', 'card', true, ws.created_by),
      (ws.id, 'Debit Card', 'Debit card payments', 'card', true, ws.created_by),
      (ws.id, 'Bank Transfer', 'Direct bank transfers', 'bank', true, ws.created_by),
      (ws.id, 'Digital Wallet', 'UPI, Paytm, etc.', 'digital', true, ws.created_by)
    ON CONFLICT (workspace_id, name) DO NOTHING;
    
    RAISE NOTICE 'Added default data for workspace: %', ws.id;
  END LOOP;
  
  RAISE NOTICE 'Completed adding default data for all existing workspaces';
END $$;

-- 2) Also, let's add a function to manually add default data for any workspace
CREATE OR REPLACE FUNCTION public.add_default_data_for_workspace(workspace_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Add default categories
  INSERT INTO public.categories (workspace_id, name, description, color, icon, is_default, created_by)
  SELECT 
    workspace_uuid,
    name,
    description,
    color,
    icon,
    is_default,
    (SELECT created_by FROM public.workspaces WHERE id = workspace_uuid)
  FROM (VALUES
    ('Food & Dining', 'Restaurants, groceries, and food delivery', '#EF4444', 'utensils', true),
    ('Transportation', 'Fuel, public transport, ride-sharing', '#3B82F6', 'car', true),
    ('Office Supplies', 'Stationery, equipment, and office expenses', '#10B981', 'briefcase', true),
    ('Utilities', 'Electricity, water, internet, phone bills', '#F59E0B', 'zap', true),
    ('Entertainment', 'Movies, games, and leisure activities', '#8B5CF6', 'music', true),
    ('Healthcare', 'Medical expenses and health-related costs', '#EC4899', 'heart', true),
    ('Travel', 'Flights, hotels, and travel expenses', '#06B6D4', 'plane', true),
    ('Other', 'Miscellaneous expenses', '#6B7280', 'more-horizontal', true)
  ) AS v(name, description, color, icon, is_default)
  ON CONFLICT (workspace_id, name) DO NOTHING;

  -- Add default payment methods
  INSERT INTO public.payment_methods (workspace_id, name, description, type, is_default, created_by)
  SELECT 
    workspace_uuid,
    name,
    description,
    type,
    is_default,
    (SELECT created_by FROM public.workspaces WHERE id = workspace_uuid)
  FROM (VALUES
    ('Cash', 'Physical cash payments', 'cash', true),
    ('Credit Card', 'Credit card payments', 'card', true),
    ('Debit Card', 'Debit card payments', 'card', true),
    ('Bank Transfer', 'Direct bank transfers', 'bank', true),
    ('Digital Wallet', 'UPI, Paytm, etc.', 'digital', true)
  ) AS v(name, description, type, is_default)
  ON CONFLICT (workspace_id, name) DO NOTHING;
  
  RAISE NOTICE 'Added default data for workspace: %', workspace_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Test that the data was added
DO $$
DECLARE
  cat_count integer;
  pm_count integer;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM public.categories;
  SELECT COUNT(*) INTO pm_count FROM public.payment_methods;
  
  RAISE NOTICE 'Total categories in database: %', cat_count;
  RAISE NOTICE 'Total payment methods in database: %', pm_count;
  
  IF cat_count > 0 AND pm_count > 0 THEN
    RAISE NOTICE '✅ Default data added successfully!';
  ELSE
    RAISE NOTICE '❌ No data found. Something went wrong.';
  END IF;
END $$;
