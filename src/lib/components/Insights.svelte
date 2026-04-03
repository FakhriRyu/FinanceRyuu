<script lang="ts">
  import { TrendingDown, TrendingUp, Target, AlertTriangle, Lightbulb } from 'lucide-svelte';
  import { monthlyData, goalUsage, budgetUsage, categoryBreakdown } from '$lib/stores';
  import { formatCurrency } from '$lib/utils';
  
  const mainGoal = $derived($goalUsage[0]);
  const currentMonthData = $derived($monthlyData[$monthlyData.length - 1] || { income: 0, expense: 0 });
  const lastMonthData = $derived($monthlyData[$monthlyData.length - 2] || { income: 0, expense: 0 });
  
  // 1. Spending Insight
  const expenseDiff = $derived(currentMonthData.expense - lastMonthData.expense);
  const expenseGrowth = $derived(lastMonthData.expense > 0 ? (expenseDiff / lastMonthData.expense) * 100 : 0);

  // 2. Budget Alert
  const overBudgets = $derived($budgetUsage.filter(b => b.percentage >= 90));

  // 3. Category Insight
  const topCategory = $derived($categoryBreakdown[0]);
</script>

<div class="relative bg-white rounded-[2.5rem] border border-black/5 shadow-soft overflow-hidden">
  <div class="relative flex flex-col p-6 lg:p-8 z-10">
    <h2 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Smart Insights</h2>
    
    <div class="flex flex-col gap-6">
      <!-- Insight 1: Spending -->
      <div class="flex gap-4 items-start group">
        {#if expenseDiff <= 0}
          <div class="w-12 h-12 shrink-0 rounded-full bg-soft-blue-50 text-soft-blue-500 flex items-center justify-center transition-transform group-hover:scale-105">
            <TrendingDown size={20} class="w-5 h-5 border-2 rounded-full p-0.5 border-soft-blue-500" />
          </div>
          <div class="flex flex-col border-b border-slate-100 pb-6 w-full">
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              Great job on spending
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              Your expenses are {Math.abs(expenseGrowth).toFixed(0)}% lower compared to last month.
            </p>
          </div>
        {:else}
          <div class="w-12 h-12 shrink-0 rounded-full bg-soft-pink-50 text-soft-pink-500 flex items-center justify-center transition-transform group-hover:scale-105">
            <TrendingUp size={20} class="w-5 h-5 border-2 rounded-full p-0.5 border-soft-pink-500" />
          </div>
          <div class="flex flex-col border-b border-slate-100 pb-6 w-full">
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              Spending increased
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              Your expenses are up by {expenseGrowth.toFixed(0)}% compared to last month.
            </p>
          </div>
        {/if}
      </div>

      <!-- Insight 2: Savings Goal -->
      <div class="flex gap-4 items-start group">
        <div class="w-12 h-12 shrink-0 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center transition-transform group-hover:scale-105">
          <Target size={20} class="w-5 h-5" />
        </div>
        <div class="flex flex-col border-b border-slate-100 pb-6 w-full">
          {#if mainGoal}
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              {mainGoal.percentage >= 100 ? 'Goal reached!' : 'On track for savings goal'}
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              {#if mainGoal.percentage >= 100}
                Congratulations! You have fully funded your {mainGoal.name}.
              {:else}
                You're only {formatCurrency(mainGoal.remaining_amount)} away from your {mainGoal.name}.
              {/if}
            </p>
          {:else}
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              Set a savings goal
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              Create a target today and start building your safety net.
            </p>
          {/if}
        </div>
      </div>

      <!-- Insight 3: Alerts or Category -->
      <div class="flex gap-4 items-start group">
        {#if overBudgets.length > 0}
          <div class="w-12 h-12 shrink-0 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center transition-transform group-hover:scale-105">
            <AlertTriangle size={20} class="w-5 h-5" />
          </div>
          <div class="flex flex-col w-full">
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              Budget Alert
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              You've used {overBudgets[0].percentage.toFixed(0)}% of your {overBudgets[0].category} budget.
            </p>
          </div>
        {:else if topCategory}
          <div class="w-12 h-12 shrink-0 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center transition-transform group-hover:scale-105">
            <Lightbulb size={20} class="w-5 h-5" />
          </div>
          <div class="flex flex-col w-full">
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              Top Spending Area
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              {topCategory.percentage.toFixed(0)}% of your expenses go to {topCategory.category}.
            </p>
          </div>
        {:else}
          <div class="w-12 h-12 shrink-0 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center transition-transform group-hover:scale-105">
            <Lightbulb size={20} class="w-5 h-5" />
          </div>
          <div class="flex flex-col w-full">
            <h3 class="text-sm lg:text-base font-bold text-slate-800 mb-1 leading-tight tracking-tight">
              Track your spending
            </h3>
            <p class="text-[10px] sm:text-xs text-slate-500 font-medium">
              Add more transactions to unlock deeper financial insights.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
