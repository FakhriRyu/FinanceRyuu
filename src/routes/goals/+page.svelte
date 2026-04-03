<script lang="ts">
  import { onMount } from 'svelte';
  import { goalUsage, fetchGoals, loading, recentSavingsActivity } from '$lib/stores';
  import GoalCard from '$lib/components/GoalCard.svelte';
  import GoalModal from '$lib/components/GoalModal.svelte';
  import { goto } from '$app/navigation';
  import { Plus, ArrowUp, ArrowDown } from 'lucide-svelte';

  let showModal = $state(false);
  let selectedGoal = $state<any>(null);

  let mode = $state<'add' | 'edit'>('add');

  onMount(() => {
    fetchGoals();
  });

  function openDetail(goal: any) {
    goto('/goals/' + goal.id);
  }

  function handleAdd() {
    selectedGoal = null;
    mode = 'add';
    showModal = true;
  }

  function handleEdit() {
    mode = 'edit';
    showModal = true;
  }

  const totalTarget = $derived($goalUsage.reduce((sum, g) => sum + g.target_amount, 0));
  const totalCollected = $derived($goalUsage.reduce((sum, g) => sum + g.current_amount, 0));
  const totalRemaining = $derived(totalTarget > totalCollected ? totalTarget - totalCollected : 0);
  
  function formatCurrency(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  }

  const conicGradient = $derived(() => {
    if ($goalUsage.length === 0 || totalTarget === 0) return 'conic-gradient(#f1f5f9 0% 100%)';
    let gradient: string[] = [];
    let currentPercent = 0;
    
    // Sort by amount desc for prettier chart
    const sorted = [...$goalUsage].sort((a,b) => b.target_amount - a.target_amount);
    
    sorted.forEach((g) => {
      const percent = (g.target_amount / totalTarget) * 100;
      if (percent > 0) {
        gradient.push(`${g.color || '#64748b'} ${currentPercent}% ${currentPercent + percent}%`);
        currentPercent += percent;
      }
    });
    if (currentPercent < 100) {
      gradient.push(`#f1f5f9 ${currentPercent}% 100%`);
    }
    return `conic-gradient(${gradient.join(', ')})`;
  });

</script>

<svelte:head>
  <title>Target — FinanceRyuu</title>
  <meta name="description" content="Pantau target menabung dan rencana masa depan Anda" />
</svelte:head>

<div class="space-y-12 animate-fade-in pb-12 px-2 pt-8">
  
  <!-- Header & Stats -->
  <div class="flex items-center justify-between gap-6">
    <div class="space-y-5">
      <div class="space-y-0.5">
        <h2 class="text-sm font-bold text-slate-500">Planned Targets</h2>
        <h1 class="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalTarget)}</h1>
      </div>
      <div class="inline-flex items-center text-xs font-bold text-slate-500 border border-slate-200 px-4 py-2 rounded-full shadow-sm bg-white">
        <span class="text-slate-900 mr-1.5">{formatCurrency(totalRemaining)}</span> Left to collect
      </div>
    </div>

    <!-- Donut Chart -->
    <div class="shrink-0 w-28 h-28 lg:w-32 lg:h-32 rounded-full relative shadow-soft" style="background: {conicGradient()};">
      <div class="absolute inset-4 lg:inset-5 bg-[#fcfdfe] rounded-full shadow-inner flex items-center justify-center">
      </div>
    </div>
  </div>

  <!-- Target Items List (Horizontal Scroll) -->
  <div class="relative pt-6">
    <div class="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:-mx-8 lg:px-8">
      
      <!-- Add Button Card -->
      <button 
        onclick={handleAdd}
        class="shrink-0 w-20 h-[140px] rounded-[2rem] border-[3px] border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50/50 transition-all snap-start"
      >
        <Plus size={28} class="mb-1 stroke-[3]" />
      </button>

      {#each $goalUsage as goal (goal.id)}
        <GoalCard {goal} onclick={() => openDetail(goal)} />
      {/each}

    </div>
  </div>

  <!-- Recent Savings Activity Section -->
  <div class="space-y-6 pt-4">
    <div class="flex items-center justify-between px-2">
      <h2 class="text-xl font-black text-slate-900 tracking-tight">Recent Savings</h2>
    </div>

    <div class="space-y-3">
      {#each $recentSavingsActivity as tx, i}
        {@const goal = $goalUsage.find(g => tx.description.includes(g.name))}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-slate-50 shadow-soft flex-1 group hover:shadow-soft-lg transition-all duration-300 cursor-pointer"
          style="animation: slide-up 0.5s ease-out {i * 0.1}s both;"
          onclick={() => goal && openDetail(goal)}
        >
          <!-- Goal Color Marker -->
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
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-black text-slate-800 truncate tracking-tight">{tx.description}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                 {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(tx.date))}
              </span>
            </div>
          </div>
          
          <div class="text-right">
            <p class="text-sm font-black {tx.type === 'income' ? 'text-soft-blue-500' : 'text-soft-pink-500'} tracking-tight">
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
            {#if goal}
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{Math.min(100, goal.percentage).toFixed(0)}% reached</span>
            {/if}
          </div>
        </div>
      {/each}
      
      {#if $recentSavingsActivity.length === 0}
        <div class="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6">
          <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">No recent savings recorded in database</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<GoalModal bind:show={showModal} goal={selectedGoal} />


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
