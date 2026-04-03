-- ============================================
-- FinanceRyuu: Create transactions table
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create transactions table
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null default 'anonymous',
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text not null,
  description text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists idx_transactions_date on public.transactions (date desc);
create index if not exists idx_transactions_type on public.transactions (type);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_category on public.transactions (category);

-- Enable Row Level Security
alter table public.transactions enable row level security;

-- Allow anonymous read/write for now (no auth required)
-- You can tighten this later when you add authentication
create policy "Allow anonymous read" on public.transactions
  for select using (true);

create policy "Allow anonymous insert" on public.transactions
  for insert with check (true);

create policy "Allow anonymous update" on public.transactions
  for update using (true);

create policy "Allow anonymous delete" on public.transactions
  for delete using (true);

-- Grant access to anon role
grant all on public.transactions to anon;
grant all on public.transactions to authenticated;
