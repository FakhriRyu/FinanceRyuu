<script lang="ts">
  import { goto } from '$app/navigation';
  import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, MoreHorizontal, Target, TrendingUp, TrendingDown } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import { 
    totalIncome, 
    totalExpense, 
    balance, 
    totalWalletBalance, 
    wallets, 
    monthlyData,
    goalUsage 
  } from '$lib/stores';

  // Get current and last month data for comparison
  const currentMonthData = $derived($monthlyData[$monthlyData.length - 1] || { income: 0, expense: 0 });
  const lastMonthData = $derived($monthlyData[$monthlyData.length - 2] || { income: 0, expense: 0 });

  const incomeGrowth = $derived(lastMonthData.income > 0 
    ? ((currentMonthData.income - lastMonthData.income) / lastMonthData.income) * 100 
    : (currentMonthData.income > 0 ? 100 : 0));

  const expenseGrowth = $derived(lastMonthData.expense > 0 
    ? ((currentMonthData.expense - lastMonthData.expense) / lastMonthData.expense) * 100 
    : (currentMonthData.expense > 0 ? 100 : 0));

  // Get top goal for reference if needed
  const mainGoal = $derived($goalUsage[0]);

  // Aggregate goal data for Planned Target card
  const totalTarget = $derived($goalUsage.reduce((acc, goal) => acc + goal.target_amount, 0));
  const totalSavedValue = $derived($goalUsage.reduce((acc, goal) => acc + goal.current_amount, 0));
  const totalPercent = $derived(totalTarget > 0 ? (totalSavedValue / totalTarget) * 100 : 0);
</script>

<div class="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 stagger">
  <!-- Card 1: Balance (Big, Flat, Minimalism) -->
  <div 
    role="button"
    tabindex="0"
    onclick={() => goto('/wallets')}
    onkeydown={(e) => e.key === 'Enter' && goto('/wallets')}
    class="col-span-2 lg:col-span-3 rounded-[3rem] p-12 lg:p-20 bg-white border border-black/5 shadow-soft-lg flex flex-col items-center justify-center group transition-all duration-500 hover:-translate-y-1 cursor-pointer"
  >
    <div class="text-center space-y-4">
      <p class="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Total Balance</p>
      <p class="text-5xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-none">
        {formatCurrency($wallets.length > 0 ? $totalWalletBalance : $balance)}
      </p>
    </div>
  </div>

  <!-- Card 2: Income (Replaced Top Category) -->
  <div 
    class="rounded-[2.5rem] p-5 lg:p-8 bg-white border border-black/5 shadow-soft flex flex-col justify-between group transition-all duration-500 hover:shadow-soft-lg hover:-translate-y-1"
  >
    <div class="flex items-center justify-between">
      <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-soft-blue-50 flex items-center justify-center text-soft-blue-500">
        <TrendingUp size={24} class="w-5 h-5 lg:w-6 lg:h-6" />
      </div>
      <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Income</span>
    </div>
    
    <div class="mt-6 lg:mt-8">
      <p class="text-lg sm:text-xl lg:text-3xl font-black text-slate-800 tracking-tight break-words">
        {formatCurrency(currentMonthData.income)}
      </p>
      <div class="flex items-center mt-2">
        {#if incomeGrowth >= 0}
          <div class="flex items-center text-[10px] font-black text-soft-blue-500 bg-soft-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            <ArrowUpRight size={10} class="mr-0.5" />
            {incomeGrowth.toFixed(1)}%
          </div>
        {:else}
          <div class="flex items-center text-[10px] font-black text-soft-pink-500 bg-soft-pink-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            <ArrowDownRight size={10} class="mr-0.5" />
            {Math.abs(incomeGrowth).toFixed(1)}%
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Card 3: Expense (Replaced Cash Flow) -->
  <div 
    class="rounded-[2.5rem] p-5 lg:p-8 bg-white border border-black/5 shadow-soft flex flex-col justify-between group transition-all duration-500 hover:shadow-soft-lg hover:-translate-y-1"
  >
    <div class="flex items-center justify-between">
      <div class="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-soft-pink-50 flex items-center justify-center text-soft-pink-500">
        <TrendingDown size={24} class="w-5 h-5 lg:w-6 lg:h-6" />
      </div>
      <span class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Expense</span>
    </div>
    
    <div class="mt-6 lg:mt-8">
      <p class="text-lg sm:text-xl lg:text-3xl font-black text-slate-800 tracking-tight break-words">
        {formatCurrency(currentMonthData.expense)}
      </p>
      <div class="flex items-center mt-2">
        {#if expenseGrowth <= 0}
          <div class="flex items-center text-[10px] font-black text-soft-blue-500 bg-soft-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            <TrendingDown size={10} class="mr-0.5" />
            {Math.abs(expenseGrowth).toFixed(1)}%
          </div>
        {:else}
          <div class="flex items-center text-[10px] font-black text-soft-pink-500 bg-soft-pink-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            <TrendingUp size={10} class="mr-0.5" />
            {expenseGrowth.toFixed(1)}%
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Card 4: Planned Target (Replaced Total Saving) -->
  <div class="col-span-2 lg:col-span-1 bg-white border border-black/5 shadow-soft rounded-[2.5rem] p-8 flex flex-col justify-between group transition-all duration-500 hover:shadow-soft-lg hover:-translate-y-1">
    <div class="flex items-center justify-between mb-8">
      <div class="w-12 h-12 rounded-2xl bg-soft-blue-50 flex items-center justify-center text-soft-blue-500">
        <Target size={24} />
      </div>
      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-300">Planned Target</span>
    </div>

    <div class="mt-auto">
      <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Total Target</p>
      <p class="text-2xl lg:text-3xl font-black mb-4 text-slate-800 tracking-tighter">
        {formatCurrency(totalTarget)}
      </p>
      <div class="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden mb-4">
        <div 
          class="h-full bg-soft-blue-500 transition-all duration-1000" 
          style="width: {totalPercent}%"
        ></div>
      </div>
      <div class="flex justify-between items-center">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Collected</p>
        <p class="text-xs font-black text-soft-blue-500">
          {formatCurrency(totalSavedValue)}
        </p>
      </div>
    </div>
  </div>
</div>




