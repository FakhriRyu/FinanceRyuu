import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

import { supabase } from './supabaseClient';
import type { Transaction, MonthlySummary, CategorySummary, Wallet, Budget, BudgetUsage, Goal, GoalUsage } from './types';
import { CATEGORY_COLORS } from './types';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import type { User } from '@supabase/supabase-js';

// ── Stores ──
export const transactions = writable<Transaction[]>([]);
export const wallets = writable<Wallet[]>([]);
export const budgets = writable<Budget[]>([]);
export const goals = writable<Goal[]>([]);
export const user = writable<User | null>(null);
export const loading = writable(false);
export const error = writable<string | null>(null);

// Theme store
const initialTheme = (browser && localStorage.getItem('theme')) || 'light';
export const theme = writable<'light' | 'dark'>(initialTheme as 'light' | 'dark');

export function toggleTheme() {
  theme.update((t) => {
    const next = t === 'light' ? 'dark' : 'light';
    if (browser) {
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return next;
  });
}

// ── Derived Stores ──
export const totalIncome = derived(transactions, ($t) =>
  $t.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
);

export const totalExpense = derived(transactions, ($t) =>
  $t.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
);

export const balance = derived([totalIncome, totalExpense], ([$i, $e]) => $i - $e);

export const totalWalletBalance = derived(wallets, ($w) => 
  $w.reduce((sum, wallet) => sum + wallet.balance, 0)
);

export const budgetUsage = derived([budgets, transactions], ([$b, $t]): BudgetUsage[] => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const currentMonthExpenses = $t.filter((t) => {
    const d = parseISO(t.date);
    return t.type === 'expense' && d >= start && d <= end;
  });

  return $b.map((budget) => {
    const spent = currentMonthExpenses
      .filter((t) => t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      ...budget,
      spent,
      remaining: Math.max(0, budget.amount - spent),
      percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    };
  });
});

export const goalUsage = derived([goals, wallets], ([$g, $w]): GoalUsage[] => {
  return $g.map((goal) => {
    // Single source of truth: if wallet is linked, use its balance
    let current = goal.current_amount;
    if (goal.wallet_id) {
      const linked = $w.find(wallet => wallet.id === goal.wallet_id);
      if (linked) current = linked.balance;
    }

    const remaining_amount = Math.max(0, goal.target_amount - current);
    const percentage = goal.target_amount > 0 ? (current / goal.target_amount) * 100 : 0;
    
    let estimated_months: number | null = null;
    if (goal.monthly_contribution > 0 && remaining_amount > 0) {
      estimated_months = Math.ceil(remaining_amount / goal.monthly_contribution);
    }

    return {
      ...goal,
      current_amount: current, // Important: update current_amount in usage
      percentage,
      remaining_amount,
      estimated_months
    };
  });
});

export const categoryBreakdown = derived(transactions, ($t): CategorySummary[] => {
  const expenses = $t.filter((t) => t.type === 'expense');
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  const map = new Map<string, number>();

  expenses.forEach((t) => {
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  });

  return Array.from(map.entries())
    .map(([category, catTotal]) => ({
      category,
      total: catTotal,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || '#64748b'
    }))
    .sort((a, b) => b.total - a.total);
});

export const monthlyData = derived(transactions, ($t): MonthlySummary[] => {
  const months: MonthlySummary[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const label = format(monthDate, 'MMM yyyy');

    const monthTransactions = $t.filter((t) => {
      const d = parseISO(t.date);
      return d >= start && d <= end;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    months.push({ month: label, income, expense, net: income - expense });
  }

  return months;
});

export const recentTransactions = derived(transactions, ($t) =>
  [...$t].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)
);

export const recentSavingsActivity = derived(transactions, ($t) =>
  $t.filter((tx) => tx.description.startsWith('Saved to '))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
);

// ── Actions ──
export async function fetchTransactions() {
  loading.set(true);
  error.set(null);

  const currentUser = get(user);
  if (!currentUser) {
    transactions.set([]);
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false });

  if (err) {
    error.set(err.message);
    // Use demo data if table doesn't exist yet
    transactions.set(generateDemoData());
  } else {
    transactions.set(data || []);
  }

  loading.set(false);
}

export async function fetchWallets() {
  loading.set(true);
  error.set(null);

  const currentUser = get(user);
  if (!currentUser) {
    wallets.set([]);
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('name', { ascending: true });

  if (err) {
    // If table doesn't exist yet, we can use demo data for now
    wallets.set(generateDemoWallets());
  } else {
    wallets.set(data || []);
  }

  loading.set(false);
}

export async function fetchBudgets() {
  loading.set(true);
  error.set(null);

  const currentUser = get(user);
  if (!currentUser) {
    budgets.set([]);
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('category', { ascending: true });

  if (err) {
    budgets.set([]);
  } else {
    budgets.set(data || []);
  }

  loading.set(false);
}

export async function fetchGoals() {
  loading.set(true);
  error.set(null);

  const currentUser = get(user);
  if (!currentUser) {
    goals.set([]);
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (err) {
    goals.set(generateDemoGoals());
  } else {
    goals.set(data || []);
  }

  loading.set(false);
}

export async function addBudget(b: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'period'>) {
  loading.set(true);
  const currentUser = get(user);
  
  if (!currentUser) {
    error.set('Harus login dahulu');
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('budgets')
    .insert([{ ...b, user_id: currentUser.id, period: 'monthly' }])
    .select()
    .single();

  if (err) {
    error.set(err.message);
  } else if (data) {
    budgets.update((bs) => [...bs, data]);
  }

  loading.set(false);
}

export async function updateBudget(id: string, amount: number) {
  loading.set(true);
  const currentUser = get(user);

  if (!currentUser) return;

  const { data, error: err } = await supabase
    .from('budgets')
    .update({ amount })
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .select()
    .single();

  if (err) {
    error.set(err.message);
  } else if (data) {
    budgets.update((bs) => bs.map((b) => b.id === id ? data : b));
  }

  loading.set(false);
}

export async function deleteBudget(id: string) {
  const currentUser = get(user);
  if (!currentUser) return;

  const { error: err } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (err) {
    error.set(err.message);
  } else {
    budgets.update((bs) => bs.filter((b) => b.id !== id));
  }
}

// ── Goal Actions ──
export async function addGoal(g: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'status'>) {
  loading.set(true);
  const currentUser = get(user);
  if (!currentUser) {
    // Demo mode fallback
    const fake: Goal = {
      ...g,
      id: crypto.randomUUID(),
      user_id: 'demo',
      status: 'active',
      created_at: new Date().toISOString()
    };
    goals.update((gs) => [fake, ...gs]);
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('goals')
    .insert([{ ...g, user_id: currentUser.id, status: 'active' }])
    .select()
    .single();

  if (err) {
    console.error('Add goal error:', err.message);
    error.set(err.message);
    // Fallback: add locally if it fails (e.g. missing column)
    const fake: Goal = {
      ...g,
      id: crypto.randomUUID(),
      user_id: currentUser.id,
      status: 'active',
      created_at: new Date().toISOString()
    };
    goals.update((gs) => [fake, ...gs]);
  } else if (data) {
    goals.update((gs) => [data, ...gs]);
  }

  loading.set(false);
}

export async function updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>) {
  loading.set(true);
  const currentUser = get(user);

  if (!currentUser) return;

  const { data, error: err } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .select()
    .single();

  if (err) {
    error.set(err.message);
  } else if (data) {
    goals.update((gs) => gs.map((g) => g.id === id ? data : g));
  }

  loading.set(false);
}

export async function deleteGoal(id: string) {
  const currentUser = get(user);
  if (!currentUser) return;

  const { error: err } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (err) {
    error.set(err.message);
  } else {
    goals.update((gs) => gs.filter((g) => g.id !== id));
  }
}

export async function addWallet(w: Omit<Wallet, 'id' | 'user_id' | 'created_at' | 'balance'>) {
  loading.set(true);
  const currentUser = get(user);
  
  if (!currentUser) {
    // Demo mode fallback
    const fake: Wallet = {
      ...w,
      id: crypto.randomUUID(),
      user_id: 'demo',
      balance: w.initial_balance,
      created_at: new Date().toISOString()
    };
    wallets.update((ws) => [...ws, fake]);
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('wallets')
    .insert([{ ...w, user_id: currentUser.id, balance: w.initial_balance }])
    .select()
    .single();

  if (err) {
    error.set(err.message);
  } else if (data) {
    wallets.update((ws) => [...ws, data]);
  }

  loading.set(false);
}

export async function updateWallet(id: string, updates: Partial<Omit<Wallet, 'id' | 'user_id' | 'created_at'>>) {
  loading.set(true);
  const currentUser = get(user);

  if (!currentUser) {
    wallets.update((ws) => ws.map((w) => w.id === id ? { ...w, ...updates } : w));
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('wallets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .select()
    .single();

  if (err) {
    error.set(err.message);
  } else if (data) {
    wallets.update((ws) => ws.map((w) => w.id === id ? data : w));
  }

  loading.set(false);
}

export async function deleteWallet(id: string) {
  const currentUser = get(user);
  
  // Optimistic local update
  wallets.update((ws) => ws.filter((w) => w.id !== id));

  if (!currentUser) return;

  const { error: err } = await supabase
    .from('wallets')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (err) {
    console.error('Delete wallet error:', err.message);
    error.set(err.message);
    // Optional: reload if delete failed server-side to stay in sync
    // fetchWallets();
  } else {
    fetchTransactions();
  }
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) {
  loading.set(true);
  const currentUser = get(user);
  
  if (!currentUser) {
    error.set('Harus login dahulu');
    loading.set(false);
    return;
  }

  const { data, error: err } = await supabase
    .from('transactions')
    .insert([{ ...tx, user_id: currentUser.id }])
    .select()
    .single();

  if (err) {
    error.set(err.message);
    // Fallback: add locally
    const fake: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      user_id: currentUser.id,
      created_at: new Date().toISOString()
    };
    transactions.update((t) => [fake, ...t]);
    // Optimistic wallet balance update
    if (fake.wallet_id) {
      wallets.update((ws) => ws.map((w) => {
        if (w.id === fake.wallet_id) {
          const change = fake.type === 'income' ? fake.amount : -fake.amount;
          return { ...w, balance: w.balance + change };
        }
        return w;
      }));
    }
  } else if (data) {
    transactions.update((t) => [data, ...t]);
    // Optimistic wallet balance update
    if (data.wallet_id) {
      wallets.update((ws) => ws.map((w) => {
        if (w.id === data.wallet_id) {
          const change = data.type === 'income' ? data.amount : -data.amount;
          return { ...w, balance: w.balance + change };
        }
        return w;
      }));
    }
  }

  loading.set(false);
}

export async function deleteTransaction(id: string) {
  const currentUser = get(user);
  if (!currentUser) return;

  const { error: err } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (err) {
    error.set(err.message);
  } else {
    // Optimistic wallet balance update
    const txToDelete = get(transactions).find(t => t.id === id);
    if (txToDelete && txToDelete.wallet_id) {
      wallets.update((ws) => ws.map((w) => {
        if (w.id === txToDelete.wallet_id) {
          const change = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
          return { ...w, balance: w.balance + change };
        }
        return w;
      }));
    }
    transactions.update((t) => t.filter((tx) => tx.id !== id));
  }
}

// ── Demo Data Generator ──
function generateDemoData(): Transaction[] {
  const now = new Date();
  const data: Transaction[] = [];
  const expenseCats = ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 'Kesehatan', 'Tagihan & Utilitas'];
  const incomeCats = ['Gaji', 'Freelance'];

  for (let i = 0; i < 6; i++) {
    const monthDate = subMonths(now, i);

    // Add salary
    data.push({
      id: crypto.randomUUID(),
      user_id: 'demo',
      type: 'income',
      amount: 8000000 + Math.random() * 2000000,
      category: 'Gaji',
      description: 'Gaji bulanan',
      date: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
      created_at: new Date().toISOString()
    });

    // Occasional freelance
    if (Math.random() > 0.4) {
      data.push({
        id: crypto.randomUUID(),
        user_id: 'demo',
        type: 'income',
        amount: 1500000 + Math.random() * 3000000,
        category: 'Freelance',
        description: 'Proyek freelance',
        date: format(new Date(monthDate.getFullYear(), monthDate.getMonth(), 10 + Math.floor(Math.random() * 15)), 'yyyy-MM-dd'),
        created_at: new Date().toISOString()
      });
    }

    // Random expenses
    const numExpenses = 5 + Math.floor(Math.random() * 6);
    for (let j = 0; j < numExpenses; j++) {
      const cat = expenseCats[Math.floor(Math.random() * expenseCats.length)];
      data.push({
        id: crypto.randomUUID(),
        user_id: 'demo',
        type: 'expense',
        amount: 50000 + Math.random() * 1500000,
        category: cat,
        description: `${cat} - item ${j + 1}`,
        date: format(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1 + Math.floor(Math.random() * 27)), 'yyyy-MM-dd'),
        created_at: new Date().toISOString()
      });
    }
  }

  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateDemoWallets(): Wallet[] {
  return [
    { id: '1', user_id: 'demo', name: 'BCA Main', type: 'bank', balance: 12500000, initial_balance: 10000000, color: '#3b82f6', icon: 'bank', created_at: new Date().toISOString() },
    { id: '2', user_id: 'demo', name: 'GoPay', type: 'e-wallet', balance: 500000, initial_balance: 500000, color: '#06b6d4', icon: 'wallet', created_at: new Date().toISOString() },
    { id: '3', user_id: 'demo', name: 'Cash', type: 'cash', balance: 250000, initial_balance: 200000, color: '#10b981', icon: 'cash', created_at: new Date().toISOString() }
  ];
}

function generateDemoGoals(): Goal[] {
  return [
    { id: 'g1', user_id: 'demo', name: 'Macbook Pro M3', target_amount: 35000000, current_amount: 15000000, monthly_contribution: 2500000, color: '#3b82f6', icon: 'laptop', status: 'active', created_at: new Date().toISOString() },
    { id: 'g2', user_id: 'demo', name: 'Japan Trip 2024', target_amount: 25000000, current_amount: 8500000, monthly_contribution: 1500000, color: '#ef4444', icon: 'plane', status: 'active', created_at: new Date().toISOString() },
    { id: 'g3', user_id: 'demo', name: 'Emergency Fund', target_amount: 50000000, current_amount: 12000000, monthly_contribution: 2000000, color: '#10b981', icon: 'shield', status: 'active', created_at: new Date().toISOString() }
  ];
}
