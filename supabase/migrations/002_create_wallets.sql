-- ============================================
-- FinanceRyuu: Create wallets table and link to transactions
-- ============================================

-- Create wallets table
create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null default 'anonymous',
  name text not null,
  type text not null check (type in ('bank', 'cash', 'e-wallet', 'savings')),
  balance numeric not null default 0,
  initial_balance numeric not null default 0,
  color text not null default '#3b82f6',
  icon text not null default 'wallet',
  created_at timestamptz not null default now()
);

-- Add wallet_id to transactions table
alter table public.transactions add column if not exists wallet_id uuid references public.wallets(id) on delete set null;

-- Create indexes
create index if not exists idx_wallets_user_id on public.wallets (user_id);
create index if not exists idx_transactions_wallet_id on public.transactions (wallet_id);

-- Enable Row Level Security
alter table public.wallets enable row level security;

-- Policies for wallets
create policy "Allow anonymous read wallets" on public.wallets for select using (true);
create policy "Allow anonymous insert wallets" on public.wallets for insert with check (true);
create policy "Allow anonymous update wallets" on public.wallets for update using (true);
create policy "Allow anonymous delete wallets" on public.wallets for delete using (true);

-- Trigger function to update wallet balance
create or replace function public.handle_transaction_balance_sync()
returns trigger as $$
begin
  -- If transaction is added
  if (tg_op = 'INSERT') then
    if (new.wallet_id is not null) then
      update public.wallets
      set balance = balance + (case when new.type = 'income' then new.amount else -new.amount end)
      where id = new.wallet_id;
    end if;
  
  -- If transaction is updated
  elsif (tg_op = 'UPDATE') then
    -- Old wallet update (revert old transaction)
    if (old.wallet_id is not null) then
      update public.wallets
      set balance = balance - (case when old.type = 'income' then old.amount else -old.amount end)
      where id = old.wallet_id;
    end if;
    
    -- New wallet update (apply new transaction)
    if (new.wallet_id is not null) then
      update public.wallets
      set balance = balance + (case when new.type = 'income' then new.amount else -new.amount end)
      where id = new.wallet_id;
    end if;
    
  -- If transaction is deleted
  elsif (tg_op = 'DELETE') then
    if (old.wallet_id is not null) then
      update public.wallets
      set balance = balance - (case when old.type = 'income' then old.amount else -old.amount end)
      where id = old.wallet_id;
    end if;
  end if;
  
  return null;
end;
$$ language plpgsql;

-- Create the trigger
drop trigger if exists on_transaction_balance_sync on public.transactions;
create trigger on_transaction_balance_sync
after insert or update or delete on public.transactions
for each row execute function public.handle_transaction_balance_sync();

-- Grant access
grant all on public.wallets to anon;
grant all on public.wallets to authenticated;
