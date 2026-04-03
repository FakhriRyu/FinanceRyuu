-- ============================================
-- FinanceRyuu: Create goals table
-- ============================================

-- Create goals table
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null default 'anonymous',
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  monthly_contribution numeric not null default 0 check (monthly_contribution >= 0),
  target_date date,
  color text not null default '#0ea5e9',
  icon text not null default 'target',
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_goals_user_id on public.goals (user_id);
create index if not exists idx_goals_status on public.goals (status);

-- Enable Row Level Security
alter table public.goals enable row level security;

-- Policies for goals
create policy "Allow anonymous read goals" on public.goals for select using (true);
create policy "Allow anonymous insert goals" on public.goals for insert with check (true);
create policy "Allow anonymous update goals" on public.goals for update using (true);
create policy "Allow anonymous delete goals" on public.goals for delete using (true);

-- Grant access
grant all on public.goals to anon;
grant all on public.goals to authenticated;
