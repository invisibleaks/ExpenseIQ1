/*
# Complete Workspace and Expenses Setup

This migration creates the complete database structure for workspace-based expense management:

## New Tables
- `workspaces` - Core workspace/business entities
- `workspace_members` - User membership in workspaces  
- `expenses` - Expense records with full feature set

## Security
- Row Level Security enabled on all tables
- Workspace-based access control via membership
- Users can only access data from their workspaces

## Features
- Custom enum types for expense source and status
- Performance indexes for common queries
- Foreign key relationships with proper cascade behavior
- Comprehensive RLS policies for secure multi-tenant access
*/

-- Extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- 1) Core tables (order matters)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 2) Enum types (create if missing)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'expense_source') then
    create type expense_source as enum ('upload','camera','voice','manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type expense_status as enum ('unreviewed','reviewed','flagged');
  end if;
end $$;

-- 3) Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  source expense_source not null,
  status expense_status not null default 'unreviewed',
  txn_date date,
  merchant text,
  amount numeric(12,2),
  currency text default 'INR',
  category_id uuid,
  category_confidence numeric(3,2),
  category_source text,
  payment_method_id uuid,
  payment_method_source text,
  payment_method_confidence numeric(3,2),
  notes text,
  is_reimbursable boolean default false,
  created_at timestamptz default now()
);

-- Helpful index for filters
create index if not exists idx_expenses_ws_status_date
  on public.expenses (workspace_id, status, txn_date desc);

-- 4) Enable RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.expenses enable row level security;

-- 5) Policies (drop if exist, then create)
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
for select using (
  exists (select 1 from public.workspace_members m
          where m.workspace_id = workspaces.id and m.user_id = auth.uid())
);

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
for insert with check (created_by = auth.uid());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
for update using (created_by = auth.uid());

drop policy if exists wm_select on public.workspace_members;
create policy wm_select on public.workspace_members
for select using (
  exists (select 1 from public.workspace_members m
          where m.workspace_id = workspace_members.workspace_id and m.user_id = auth.uid())
);

drop policy if exists wm_insert on public.workspace_members;
create policy wm_insert on public.workspace_members
for insert with check (
  exists (select 1 from public.workspaces w
          where w.id = workspace_id and w.created_by = auth.uid())
);

drop policy if exists wm_delete on public.workspace_members;
create policy wm_delete on public.workspace_members
for delete using (
  exists (select 1 from public.workspaces w
          where w.id = workspace_id and w.created_by = auth.uid())
);

drop policy if exists expenses_rw on public.expenses;
create policy expenses_rw on public.expenses
for all using (
  exists (select 1 from public.workspace_members m
          where m.workspace_id = expenses.workspace_id and m.user_id = auth.uid())
)
with check (
  exists (select 1 from public.workspace_members m
          where m.workspace_id = expenses.workspace_id and m.user_id = auth.uid())
);