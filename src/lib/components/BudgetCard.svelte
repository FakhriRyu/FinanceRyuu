<script lang="ts">
  import type { BudgetUsage } from '$lib/types';
  import { CATEGORY_COLORS } from '$lib/types';

  let { budget, onclick }: { budget: BudgetUsage, onclick?: () => void } = $props();

  const color = $derived(budget.color || CATEGORY_COLORS[budget.category] || '#64748b');
  const percentage = $derived(Math.min(100, budget.percentage));
  
  function formatCurrency(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
  class="shrink-0 w-36 h-[140px] rounded-[2rem] p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg snap-start cursor-pointer"
  style="background-color: {color};"
  onclick={onclick}
  onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
  <!-- Background Blobs to mimic the glassy texture in the reference -->
  <div class="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/20 blur-xl pointer-events-none"></div>
  <div class="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-black/10 blur-xl pointer-events-none"></div>

  <div class="space-y-1 relative z-10">
    <h3 class="text-sm font-bold text-white/90 truncate tracking-tight">{budget.category}</h3>
    <h2 class="text-xl font-black text-white tracking-tighter truncate">{formatCurrency(budget.spent)}</h2>
  </div>

  <div class="flex items-center justify-between relative z-10 w-full">
    <div class="text-[10px] font-black bg-white/20 px-3 py-1.5 rounded-full text-white w-fit tracking-widest backdrop-blur-sm shadow-sm">
      {percentage.toFixed(0)}%
    </div>
  </div>
</div>

<style>
</style>
