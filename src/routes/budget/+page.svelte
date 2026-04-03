<script lang="ts">
  import { onMount } from 'svelte';
  import { budgetUsage, fetchBudgets, fetchTransactions, loading, transactions } from '$lib/stores';
  import { CATEGORY_COLORS } from '$lib/types';
  import { formatDate } from '$lib/utils';
  import BudgetCard from '$lib/components/BudgetCard.svelte';
  import BudgetModal from '$lib/components/BudgetModal.svelte';
  import BudgetDetailModal from '$lib/components/BudgetDetailModal.svelte';
  import { Plus, ArrowUp, ArrowDown } from 'lucide-svelte';

  let showModal = $state(false);
  let selectedBudget = $state<any>(null);
  let showDetail = $state(false);

  onMount(() => {
    fetchBudgets();
    fetchTransactions();
  });

  function openDetail(budget: any) {
    selectedBudget = budget;
    showDetail = true;
  }

  const totalBudget = $derived($budgetUsage.reduce((sum, b) => sum + b.amount, 0));
  const totalSpent = $derived($budgetUsage.reduce((sum, b) => sum + b.spent, 0));
  const totalRemaining = $derived(totalBudget - totalSpent);
  
  function formatCurrency(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  }

  const conicGradient = $derived(() => {
    if ($budgetUsage.length === 0 || totalBudget === 0) return 'conic-gradient(#f1f5f9 0% 100%)';
    let gradient: string[] = [];
    let currentPercent = 0;
    
    // Sort by amount desc for prettier chart
    const sorted = [...$budgetUsage].sort((a,b) => b.amount - a.amount);
    
    sorted.forEach((b) => {
      const percent = (b.amount / totalBudget) * 100;
      if (percent > 0) {
        const color = b.color || CATEGORY_COLORS[b.category] || '#64748b';
        gradient.push(`${color} ${currentPercent}% ${currentPercent + percent}%`);
        currentPercent += percent;
      }
    });
    if (currentPercent < 100) {
      gradient.push(`#f1f5f9 ${currentPercent}% 100%`);
    }
    return `conic-gradient(${gradient.join(', ')})`;
  });

  const recentBudgetActivity = $derived(() => {
    const budgetCats = $budgetUsage.map(b => b.category);
    return [...$transactions]
      .filter(tx => tx.type === 'expense' && budgetCats.includes(tx.category))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  });
</script>

<svelte:head>
  <title>Budget — FinanceRyuu</title>
</svelte:head>

<div class="space-y-12 animate-fade-in pb-12 px-2 pt-8">
  
  <!-- Header & Stats -->
  <div class="flex items-center justify-between gap-6">
    <div class="space-y-5">
      <div class="space-y-0.5">
        <h2 class="text-sm font-bold text-slate-500">Planned Expenses</h2>
        <h1 class="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalBudget)}</h1>
      </div>
      <div class="inline-flex items-center text-xs font-bold text-slate-500 border border-slate-200 px-4 py-2 rounded-full shadow-sm bg-white">
        <span class="text-slate-900 mr-1.5">{formatCurrency(totalRemaining)}</span> Left to budget
      </div>
    </div>

    <!-- Donut Chart -->
    <div class="shrink-0 w-28 h-28 lg:w-32 lg:h-32 rounded-full relative shadow-soft" style="background: {conicGradient()};">
      <div class="absolute inset-4 lg:inset-5 bg-[#fcfdfe] rounded-full shadow-inner flex items-center justify-center">
      </div>
    </div>
  </div>

  <!-- Budget Items List (Horizontal Scroll) -->
  <div class="relative pt-6">
    <div class="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:-mx-8 lg:px-8">
      
      <!-- Add Button Card -->
      <button 
        onclick={() => (showModal = true)}
        class="shrink-0 w-20 h-[140px] rounded-[2rem] border-[3px] border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50/50 transition-all snap-start"
      >
        <Plus size={28} class="mb-1 stroke-[3]" />
      </button>

      {#each $budgetUsage as budget (budget.id)}
        <BudgetCard {budget} onclick={() => openDetail(budget)} />
      {/each}

    </div>
  </div>

  <!-- Recent Activity Section -->
  <div class="space-y-6 pt-4">
    <div class="flex items-center justify-between px-2">
      <h2 class="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h2>
      <a href="/transactions" class="text-xs font-bold text-soft-blue-500 hover:text-soft-blue-600 transition-colors uppercase tracking-widest">All</a>
    </div>

    <div class="space-y-3">
      {#each recentBudgetActivity() as tx, i}
        {@const budget = $budgetUsage.find(b => b.category === tx.category)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-50 shadow-soft flex-1 group hover:shadow-soft-lg transition-all duration-300 cursor-pointer"
          style="animation: slide-up 0.5s ease-out {i * 0.1}s both;"
          onclick={() => budget && openDetail(budget)}
        >
          <!-- Category Marker -->
          <div 
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" 
            style="background: {(budget?.color || CATEGORY_COLORS[tx.category] || '#64748b')}15; color: {budget?.color || CATEGORY_COLORS[tx.category] || '#64748b'}"
          >
            {#if tx.type === 'income'}
              <ArrowUp size={20} strokeWidth={2.5} />
            {:else}
              <ArrowDown size={20} strokeWidth={2.5} />
            {/if}
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-black text-slate-800 truncate tracking-tight">{tx.description}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(tx.date)}</span>
            </div>
          </div>
          
          <!-- Amount -->
          <div class="text-right">
            <p class="text-sm font-black text-slate-900 tracking-tight">-{formatCurrency(tx.amount)}</p>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tx.category}</span>
          </div>
        </div>
      {/each}
      
      {#if recentBudgetActivity().length === 0}
        <div class="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6">
          <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">No recent transactions in budgeted categories</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<BudgetModal bind:show={showModal} />
<BudgetDetailModal bind:show={showDetail} budget={selectedBudget} />

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
</style>
