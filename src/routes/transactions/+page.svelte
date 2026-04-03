<script lang="ts">
  import { transactions, deleteTransaction, wallets } from '$lib/stores';
  import { formatCurrency, formatDate } from '$lib/utils';
  import { CATEGORY_COLORS } from '$lib/types';
  import type { TransactionType } from '$lib/types';
  import TransactionModal from '$lib/components/TransactionModal.svelte';
  import MonthlyChart from '$lib/components/MonthlyChart.svelte';
  import { 
    Plus, 
    Trash2, 
    Search, 
    ArrowUp,
    ArrowDown,
    ArrowUpRight, 
    ArrowDownRight, 
    Filter,
    Download,
    Calendar as CalendarIcon,
    MoreVertical
  } from 'lucide-svelte';
  import ReportDownloadModal from '$lib/components/ReportDownloadModal.svelte';

  let showModal = $state(false);
  let showDownloadModal = $state(false);
  let searchQuery = $state('');
  let filterType = $state<TransactionType | 'all'>('all');

  const filteredTransactions = $derived(
    $transactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesType;
    })
  );

  // Group transactions by month
  const groupedTransactions = $derived(() => {
    const groups: Record<string, typeof $transactions> = {};
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(tx);
    });
    return Object.entries(groups).sort((a, b) => {
      return new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime();
    });
  });

  const getWalletName = (id?: string) => {
    if (!id) return 'Personal';
    const wallet = $wallets.find(w => w.id === id);
    return wallet ? wallet.name : 'Wallet';
  };
</script>


<svelte:head>
  <title>Report — FinanceRyuu</title>
</svelte:head>

<div class="space-y-12 animate-fade-in pb-12">
  <!-- Header -->
  <div class="flex items-center justify-between px-2 pt-4">
    <h1 class="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">Report</h1>
    <div class="flex gap-3">
      <button 
        onclick={() => (showDownloadModal = true)}
        class="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Download size={20} />
      </button>
      <button class="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
        <CalendarIcon size={20} />
      </button>
    </div>
  </div>

  <!-- Report Chart Card -->
  <MonthlyChart />

  <!-- List Section -->
  <div class="space-y-8">
    <!-- Search & Quick Filters -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between px-2">
      <div class="relative w-full md:w-96">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search reports..."
          class="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-12 pr-6 text-sm font-bold shadow-soft focus:outline-none focus:ring-4 focus:ring-soft-blue-500/10 transition-all"
        />
      </div>
      
      <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-100 w-full md:w-auto">
        <button 
          onclick={() => filterType = 'all'}
          class="flex-1 md:flex-none px-6 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all {filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}"
        >All</button>
        <button 
          onclick={() => filterType = 'income'}
          class="flex-1 md:flex-none px-6 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all {filterType === 'income' ? 'bg-white text-soft-blue-600 shadow-sm' : 'text-slate-400'}"
        >Income</button>
        <button 
          onclick={() => filterType = 'expense'}
          class="flex-1 md:flex-none px-6 py-2.5 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all {filterType === 'expense' ? 'bg-white text-soft-pink-600 shadow-sm' : 'text-slate-400'}"
        >Expense</button>
      </div>
    </div>

    <!-- Grouped Transactions -->
    {#each groupedTransactions() as [month, txs]}
      <div class="space-y-4">
        <h2 class="text-xl font-black text-slate-900 px-2 tracking-tight">{month.split(' ')[0]}</h2>
        <div class="space-y-4">
          {#each txs as tx, i}
            <div
              class="bg-white p-5 rounded-[2rem] border border-black/5 shadow-soft flex items-center justify-between gap-6 group hover:shadow-soft-lg transition-all duration-300 relative overflow-hidden"
              style="animation: slide-up 0.4s ease-out {Math.min(i * 0.05, 0.5)}s both;"
            >
              <!-- Icon/Logo -->
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0" 
                style="background: {tx.type === 'income' ? 'var(--color-soft-blue-50)' : 'var(--color-soft-pink-50)'}; color: {tx.type === 'income' ? 'var(--color-soft-blue-500)' : 'var(--color-soft-pink-500)'}"
              >
                {#if tx.type === 'income'}
                  <ArrowUp size={20} strokeWidth={2.5} />
                {:else}
                  <ArrowDown size={20} strokeWidth={2.5} />
                {/if}
              </div>

              <!-- Main Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black text-slate-800 truncate tracking-tight">{tx.description}</p>
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{formatDate(tx.date)}</p>
              </div>

              <!-- Right Info -->
              <div class="text-right transition-all group-hover:pr-14">
                <p class="text-sm font-black tracking-tighter {tx.type === 'income' ? 'text-soft-blue-500' : 'text-soft-pink-500'}">
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{getWalletName(tx.wallet_id)}</p>
              </div>

              <!-- Actions (Absolute Hidden Menu) -->
              <div class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex gap-1 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onclick={() => tx.id && deleteTransaction(tx.id)}
                  class="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-soft-pink-500 hover:bg-soft-pink-50 transition-all shadow-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}


    {#if filteredTransactions.length === 0}
      <div class="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-soft">
        <div class="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Search class="w-10 h-10 text-slate-200" />
        </div>
        <p class="text-slate-400 text-sm font-bold uppercase tracking-widest">No matching reports</p>
      </div>
    {/if}
  </div>
</div>

<TransactionModal bind:show={showModal} />

{#if showDownloadModal}
  <ReportDownloadModal bind:show={showDownloadModal} />
{/if}

<!-- Floating Action Button -->
<button 
  onclick={() => (showModal = true)}
  class="fixed bottom-28 lg:bottom-12 right-6 lg:right-12 w-18 h-18 rounded-[1.5rem] bg-gradient-to-br from-soft-pink-500 to-soft-blue-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 shadow-soft-blue-500/25 hover:shadow-soft-blue-500/40 transition-all z-40 group"
>
  <div class="group-hover:rotate-90 transition-transform duration-500">
    <Plus size={32} strokeWidth={3} />
  </div>
</button>
