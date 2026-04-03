-- ============================================
-- FinanceRyuu: Create budgets table
-- ============================================

-- Create budgets table
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null default 'anonymous',
  category text not null,
  amount numeric not null check (amount > 0),
  period text not null default 'monthly',
  created_at timestamptz not null default now(),
  unique(user_id, category, period)
);

-- Create indexes
create index if not exists idx_budgets_user_id on public.budgets (user_id);
create index if not exists idx_budgets_category on public.budgets (category);

-- Enable Row Level Security
alter table public.budgets enable row level security;

-- Policies for budgets
create policy "Allow anonymous read budgets" on public.budgets for select using (true);
create policy "Allow anonymous insert budgets" on public.budgets for insert with check (true);
create policy "Allow anonymous update budgets" on public.budgets for update using (true);
create policy "Allow anonymous delete budgets" on public.budgets for delete using (true);

-- Grant access
grant all on public.budgets to anon;
grant all on public.budgets to authenticated;
