<script lang="ts">
  import { recentTransactions } from '$lib/stores';
  import { formatCurrency, formatDate } from '$lib/utils';
  import { CATEGORY_COLORS } from '$lib/types';
  import { ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight } from 'lucide-svelte';
</script>

<div class="bg-white rounded-[2.5rem] border border-black/5 shadow-soft p-8">
  <div class="flex items-center justify-between mb-8">
    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Activity</h3>
    <a href="/transactions" class="text-xs font-bold text-soft-blue-500 hover:text-soft-blue-600 transition-colors">
      View All →
    </a>
  </div>

  {#if $recentTransactions.length === 0}
    <div class="text-center py-16 flex flex-col items-center gap-4">
      <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
        <ArrowUpRight class="w-8 h-8 text-slate-200" />
      </div>
      <p class="text-slate-400 text-sm font-bold">No transactions yet</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each $recentTransactions as tx, i}
        <div
          class="flex items-center gap-5 p-4 rounded-3xl hover:bg-slate-50 transition-all duration-300 group cursor-default"
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

          <!-- Details -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-slate-800 font-bold truncate tracking-tight">{tx.description}</p>
            <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{tx.category} · {formatDate(tx.date)}</p>
          </div>

          <!-- Amount -->
          <span class="text-sm font-black shrink-0 {tx.type === 'income' ? 'text-soft-blue-500' : 'text-soft-pink-500'} tracking-tight">
            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

