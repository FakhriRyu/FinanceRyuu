<script lang="ts">
  import { X, Target, Save, Calendar, Info, Wallet as WalletIcon, ChevronDown } from 'lucide-svelte';
  import { addGoal, updateGoal, wallets } from '$lib/stores';
  import type { Goal } from '$lib/types';
  import { fade, scale } from 'svelte/transition';

  let { show = $bindable(), goal = null }: { show: boolean, goal?: Goal | null } = $props();

  let name = $state('');
  let target_amount = $state<number>(0);
  let current_amount = $state<number>(0);
  let monthly_contribution = $state<number>(0);
  let target_date = $state<string>('');
  let color = $state('#0ea5e9');
  let wallet_id = $state<string>('');

  const colors = [
    '#0ea5e9', // Ocean Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#14b8a6', // Teal
  ];

  $effect(() => {
    if (goal) {
      name = goal.name;
      target_amount = goal.target_amount;
      current_amount = goal.current_amount;
      monthly_contribution = goal.monthly_contribution;
      target_date = goal.target_date || '';
      color = goal.color;
      wallet_id = goal.wallet_id || '';
    } else {
      reset();
    }
  });

  function reset() {
    name = '';
    target_amount = 0;
    current_amount = 0;
    monthly_contribution = 0;
    target_date = '';
    color = '#0ea5e9';
    wallet_id = '';
  }

  async function handleSubmit() {
    if (!name || target_amount <= 0) return;

    const goalData = {
      name,
      target_amount,
      current_amount,
      monthly_contribution,
      target_date: target_date || undefined,
      color,
      icon: 'target',
      wallet_id: wallet_id || undefined
    };

    if (goal) {
      await updateGoal(goal.id, goalData);
    } else {
      await addGoal(goalData);
    }
    show = false;
  }

  $effect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fade-in"
    onclick={() => (show = false)}
    onkeydown={(e) => e.key === 'Escape' && (show = false)}
    role="button"
    tabindex="0"
  >
    <!-- Modal Content -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="glass-strong relative w-full sm:max-w-lg rounded-t-[2.5rem] rounded-b-none sm:rounded-3xl shadow-2xl transition-all animate-modal-slide-up max-h-[92vh] overflow-y-auto overscroll-contain"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
    >
      <!-- Drag Handle for Mobile -->
      <div class="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mt-6 sm:hidden"></div>
      <!-- Header -->
      <div class="px-8 pt-8 pb-6 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div 
            class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            style="background: {color}15; color: {color}"
          >
            <Target size={20} />
          </div>
          <div>
            <h2 class="text-xl font-black text-slate-900 tracking-tight">
              {goal ? 'Edit Target' : 'New Target'}
            </h2>
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
              Plan your next big thing
            </p>
          </div>
        </div>
        <button 
          onclick={() => (show = false)}
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Form -->
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="px-8 pb-8 space-y-6">
        <!-- Goal Name -->
        <div class="space-y-1.5">
          <label for="name" class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Goal Name</label>
          <input 
            type="text" 
            id="name" 
            bind:value={name} 
            placeholder="e.g. New Macbook, Vacation"
            class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-300 text-sm"
            required
          />
        </div>

        <!-- Wallet Linked -->
        <div class="space-y-1.5">
          <label for="wallet" class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Link Saving Source Wallet</label>
          <div class="relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <WalletIcon size={16} />
            </div>
            <select 
              id="wallet" 
              bind:value={wallet_id}
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-10 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="">Manual Selection (No link)</option>
              {#each $wallets as w}
                <option value={w.id}>{w.name}</option>
              {/each}
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <!-- Target Amount -->
        <div class="space-y-1.5">
          <label for="target" class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Target Amount (Rp)</label>
          <input 
            type="number" 
            id="target" 
            bind:value={target_amount} 
            class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            required
            placeholder="0"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Monthly Contribution -->
          <div class="space-y-1.5">
            <label for="monthly" class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Monthly Saving (Rp)</label>
            <input 
              type="number" 
              id="monthly" 
              bind:value={monthly_contribution} 
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              placeholder="0"
            />
          </div>
          <!-- Target Date -->
          <div class="space-y-1.5">
            <label for="date" class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Target Date (Optional)</label>
            <div class="relative">
              <input 
                type="date" 
                id="date" 
                bind:value={target_date} 
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>


        <!-- Color Selection -->
        <div class="space-y-3">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Label Color</span>
          <div class="flex flex-wrap gap-2.5" role="group">
            {#each colors as c}
              <button
                type="button"
                onclick={() => (color = c)}
                class="w-7 h-7 rounded-lg border-2 transition-all {color === c ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}"
                style="background-color: {c}"
                aria-label="Color {c}"
              ></button>
            {/each}
          </div>
        </div>

        <div class="flex items-center gap-3 p-3 bg-soft-blue-50/50 rounded-2xl border border-soft-blue-100">
           <Info size={14} class="text-soft-blue-500 shrink-0" />
           <p class="text-[10px] font-bold text-soft-blue-700 leading-tight">Monthly savings help us estimate when you'll reach your dream.</p>
        </div>

        <!-- Action -->
        <button 
          type="submit"
          class="w-full bg-slate-900 text-white py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
        >
          <Save size={16} />
          {goal ? 'Save Changes' : 'Create Target'}
        </button>
      </form>
    </div>
  </div>
{/if}

