<script lang="ts">
  import { categoryBreakdown } from '$lib/stores';
  import { formatCurrency } from '$lib/utils';
  import { ArrowUpRight } from 'lucide-svelte';

  const maxValue = $derived(
    $categoryBreakdown.length > 0 ? Math.max(...$categoryBreakdown.map((c) => c.total)) : 1
  );
</script>

<div class="glass-card p-6">
  <h3 class="text-sm font-bold text-black/60 dark:text-white/70 uppercase tracking-widest mb-6">Pengeluaran per Kategori</h3>

  {#if $categoryBreakdown.length === 0}
    <div class="text-center py-12 flex flex-col items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
        <ArrowUpRight class="w-6 h-6 text-black/20 dark:text-white/20" />
      </div>
      <p class="text-black/40 dark:text-white/30 text-sm font-medium">Belum ada data pengeluaran</p>
    </div>
  {:else}
    <div class="space-y-5">
      {#each $categoryBreakdown as cat, i}
        <div class="group" style="animation: slide-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) {i * 0.08}s both;">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2.5">
              <div class="w-2.5 h-2.5 rounded-full shadow-sm shadow-black/5" style="background-color: {cat.color};"></div>
              <span class="text-sm text-black dark:text-white/90 font-bold tracking-tight">{cat.category}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-[10px] text-black/40 dark:text-white/40 font-black uppercase tracking-widest leading-none bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">{cat.percentage.toFixed(0)}%</span>
              <span class="text-sm font-bold text-black dark:text-white tracking-tight">{formatCurrency(cat.total)}</span>
            </div>
          </div>
          <div class="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden shadow-inner">
            <div
              class="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 shadow-sm"
              style="width: {(cat.total / maxValue) * 100}%; background-color: {cat.color};"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
