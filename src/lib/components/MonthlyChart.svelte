<script lang="ts">
  import { transactions } from '$lib/stores';
  import { formatCurrency } from '$lib/utils';
  import { 
    format, 
    subDays, 
    subWeeks, 
    subMonths, 
    startOfDay, 
    endOfDay, 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    parseISO,
    isWithinInterval
  } from 'date-fns';
  import { ArrowUpRight, ChevronDown } from 'lucide-svelte';

  let viewType = $state<'day' | 'week' | 'month'>('month');
  let filterType = $state<'income' | 'expense'>('expense');
  let showTypeDropdown = $state(false);

  // Compute chart data based on timeframe & type
  const chartData = $derived(() => {
    const data = [];
    const now = new Date();
    
    if (viewType === 'day') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const start = startOfDay(date);
        const end = endOfDay(date);
        const val = $transactions
          .filter(t => t.type === filterType && isWithinInterval(parseISO(t.date), { start, end }))
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({ label: format(date, 'd'), value: val });
      }
    } else if (viewType === 'week') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const date = subWeeks(now, i);
        const start = startOfWeek(date);
        const end = endOfWeek(date);
        const val = $transactions
          .filter(t => t.type === filterType && isWithinInterval(parseISO(t.date), { start, end }))
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({ label: `W${4-i}`, value: val });
      }
    } else {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const val = $transactions
          .filter(t => t.type === filterType && isWithinInterval(parseISO(t.date), { start, end }))
          .reduce((sum, t) => sum + t.amount, 0);
        data.push({ label: format(date, 'MMM'), value: val });
      }
    }
    return data;
  });

  const maxVal = $derived(Math.max(...chartData().map(d => d.value), 1));
  const maxIdx = $derived(chartData().reduce((max, curr, i, arr) => curr.value > arr[max].value ? i : max, 0));
</script>

<div class="bg-white rounded-[2.5rem] border border-black/5 shadow-soft p-8">
  <div class="flex items-center justify-between mb-10">
    <div class="relative">
      <button 
        onclick={() => showTypeDropdown = !showTypeDropdown}
        class="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <span class="text-sm font-black text-slate-800 capitalize">{filterType}s</span>
        <ChevronDown size={16} class="text-slate-400 transition-transform {showTypeDropdown ? 'rotate-180' : ''}" />
      </button>

      {#if showTypeDropdown}
        <div class="absolute top-full left-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 animate-fade-in overflow-hidden">
          <button 
            onclick={() => { filterType = 'income'; showTypeDropdown = false; }}
            class="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >Incomes</button>
          <button 
            onclick={() => { filterType = 'expense'; showTypeDropdown = false; }}
            class="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 border-t border-slate-50 hover:bg-slate-50 transition-colors"
          >Expenses</button>
        </div>
      {/if}
    </div>
    
    <div class="flex rounded-2xl bg-slate-50 p-1 border border-slate-100">
      <button 
        onclick={() => viewType = 'day'}
        class="px-5 py-2 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all {viewType === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}"
      >Day</button>
      <button 
        onclick={() => viewType = 'week'}
        class="px-5 py-2 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all {viewType === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}"
      >Week</button>
      <button 
        onclick={() => viewType = 'month'}
        class="px-5 py-2 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all {viewType === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}"
      >Month</button>
    </div>
  </div>

  {#if chartData().every(d => d.value === 0)}
    <div class="text-center py-20 flex flex-col items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
        <ArrowUpRight size={32} class="text-slate-200" />
      </div>
      <p class="text-slate-400 text-sm font-bold uppercase tracking-widest">No data available for this range</p>
    </div>
  {:else}
    <!-- Bar Chart with Grid -->
    <div class="relative h-64 mt-12 mb-4">
      <!-- Grid Lines -->
      <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
        {#each Array(4) as _}
          <div class="w-full border-t border-slate-100 border-dashed"></div>
        {/each}
      </div>
      
      <!-- Bars -->
      <div class="relative h-full flex items-end gap-3 lg:gap-6 px-1">
        {#each chartData() as item, i}
          {@const isMax = i === maxIdx && item.value > 0}
          {@const colorVar = filterType === 'income' ? 'soft-blue' : 'soft-pink'}
          <div class="flex-1 flex flex-col items-center group h-full justify-end">
            <div class="relative w-full flex items-end justify-center h-full pb-8">
              {#if isMax}
                <!-- Tooltip Overlay -->
                <div class="absolute bottom-[calc(100%-25px)] z-20 mb-2 px-3 py-2 bg-{colorVar}-500 text-white text-[10px] font-black rounded-xl shadow-lg shadow-{colorVar}-500/30 animate-fade-in whitespace-nowrap">
                  {formatCurrency(item.value)}
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-{colorVar}-500 rotate-45"></div>
                </div>
              {/if}
              
              <!-- Value bar -->
              <div class="relative w-full max-w-[20px] lg:max-w-[24px] rounded-full overflow-hidden transition-all duration-500 origin-bottom shadow-sm cursor-pointer"
                style="height: {Math.max((item.value / maxVal) * 80, 5)}%; 
                       background: linear-gradient(180deg, var(--color-{colorVar}-400) 0%, var(--color-{colorVar}-50) 100%); opacity: {item.value === 0 ? '0.1' : '1'};">
              </div>
            </div>
            <!-- Labels -->
            <span class="text-[10px] font-black uppercase tracking-wider transition-colors duration-300 {isMax ? `text-${colorVar}-500` : 'text-slate-400'}">
              {item.label}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>


