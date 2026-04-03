// Types for FinanceRyuu
export type TransactionType = 'income' | 'expense';
export type WalletType = 'bank' | 'cash' | 'e-wallet' | 'savings';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  initial_balance: number;
  color: string;
  icon: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  wallet_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: string;
  color?: string;
  created_at: string;
}

export interface BudgetUsage extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date?: string;
  color: string;
  icon: string;
  status: 'active' | 'completed';
  wallet_id?: string;
  created_at: string;
}

export interface GoalUsage extends Goal {
  percentage: number;
  remaining_amount: number;
  estimated_months: number | null;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  color: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Tagihan & Utilitas',
  'Lainnya'
] as const;

export const INCOME_CATEGORIES = [
  'Gaji',
  'Freelance',
  'Investasi',
  'Hadiah',
  'Lainnya'
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  'Makanan & Minuman': '#3b82f6',
  'Transportasi': '#06b6d4',
  'Belanja': '#8b5cf6',
  'Hiburan': '#f59e0b',
  'Kesehatan': '#ef4444',
  'Pendidikan': '#10b981',
  'Tagihan & Utilitas': '#6366f1',
  'Lainnya': '#64748b',
  'Gaji': '#22c55e',
  'Freelance': '#14b8a6',
  'Investasi': '#a855f7',
  'Hadiah': '#f472b6',
};
