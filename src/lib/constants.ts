import { 
  LayoutDashboard, 
  ReceiptText, 
  Wallet, 
  Target,
  PieChart
} from 'lucide-svelte';

export const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Transaksi', icon: ReceiptText, href: '/transactions' },
  { name: 'Anggaran', icon: PieChart, href: '/budget' },
  { name: 'Target', icon: Target, href: '/goals' }
];
