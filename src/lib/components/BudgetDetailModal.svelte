<script lang="ts">
  import type { BudgetUsage } from '$lib/types';
  import { CATEGORY_COLORS } from '$lib/types';
  import { X, TrendingUp, AlertTriangle, Target, Trash2 } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import { deleteBudget } from '$lib/stores';

  let { show = $bindable(false), budget }: { show: boolean, budget: BudgetUsage | null } = $props();

  const color = $derived(budget ? (budget.color || CATEGORY_COLORS[budget.category] || '#64748b') : '#64748b');
  const percentage = $derived(budget ? Math.min(100, budget.percentage) : 0);
  const isDanger = $derived(budget ? budget.percentage >= 95 : false);

  function close() { show = false; }

  async function handleDelete() {
    if (!budget) return;
    if (confirm(`Hapus anggaran untuk ${budget.category}?`)) {
      await deleteBudget(budget.id);
      show = false;
    }
  }
</script>

{#if show && budget}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-slide-up shadow-soft-lg border border-slate-100" onclick={e => e.stopPropagation()} onkeydown={() => {}}>
      
      <!-- Header with Category Color -->
      <div class="h-32 relative flex items-end px-8 pb-6" style="background-color: {color}">
         <!-- Background Blobs -->
         <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20 blur-2xl"></div>
         <div class="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-black/10 blur-2xl"></div>

         <button onclick={close} class="absolute top-6 right-6 p-2 rounded-full bg-black/10 text-white hover:bg-black/20 transition-all">
           <X size={20} />
         </button>
         
         <div class="relative z-10 space-y-1">
           <p class="text-[10px] font-black text-white/70 uppercase tracking-widest">Monthly Budget</p>
           <h2 class="text-2xl font-black text-white tracking-tighter">{budget.category}</h2>
         </div>
      </div>

      <div class="p-8 space-y-8">
        <!-- Main Stats -->
        <div class="grid grid-cols-2 gap-8">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <Target size={14} class="text-slate-400" />
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</p>
            </div>
            <p class="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(budget.amount)}</p>
          </div>
          <div class="space-y-1.5 text-right">
             <div class="flex items-center justify-end gap-2">
              <TrendingUp size={14} class="text-slate-400" />
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spent</p>
            </div>
            <p class="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(budget.spent)}</p>
          </div>
        </div>

        <!-- Progress Bar Section -->
        <div class="space-y-4">
          <div class="flex justify-between items-end px-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Progress</p>
            <div class="flex items-center gap-2">
              {#if isDanger}
                <AlertTriangle size={14} class="text-soft-pink-500 animate-pulse" />
              {/if}
              <p class="text-lg font-black {isDanger ? 'text-soft-pink-500' : 'text-slate-900'} tracking-tighter">
                {budget.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div class="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
            <div 
              class="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
              style="width: {percentage}%; background-color: {color}"
            ></div>
          </div>
        </div>

        <!-- Remaining Insight Card -->
        <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
            <p class="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(budget.remaining)}</p>
          </div>
          {#if isDanger}
             <div class="bg-soft-pink-100 text-soft-pink-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce-subtle">
               Alert
             </div>
          {:else}
             <div class="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
               On Track
             </div>
          {/if}
        </div>

        <!-- Delete Action -->
        <button 
          onclick={handleDelete}
          class="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-soft-pink-500 font-black text-[10px] uppercase tracking-widest bg-soft-pink-50 hover:bg-soft-pink-100 transition-all border border-soft-pink-50"
        >
          <Trash2 size={14} class="stroke-[3]" />
          Delete Budget
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
  .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
</style>
