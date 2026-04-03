<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { goalUsage, updateGoal, addTransaction, recentSavingsActivity, wallets, updateWallet, fetchWallets, deleteGoal } from '$lib/stores';
  import { ArrowLeft, ArrowDownLeft, Plus, DollarSign, ArrowUp, ArrowDown, Calendar, TrendingUp, Wallet as WalletIcon, ChevronDown, Trash2 } from 'lucide-svelte';
  import type { GoalUsage } from '$lib/types';

  const goal = $derived($goalUsage.find((g) => g.id === $page.params.id) as GoalUsage | undefined);

  // Custom Action Modal states
  let showActionModal = $state(false);
  let actionType = $state<'add' | 'cashout'>('add');
  let actionAmount = $state('');
  let selectedWalletId = $state('');
  let editingWallet = $state(false);
  let showDeleteModal = $state(false);

  onMount(() => {
    if ($wallets.length === 0) {
      fetchWallets();
    }
  });

  const linkedWallet = $derived(goal?.wallet_id ? $wallets.find(w => w.id === goal.wallet_id) : null);
  const currentAmount = $derived(linkedWallet ? linkedWallet.balance : (goal?.current_amount || 0));
  const percentage = $derived(goal ? Math.min(100, (currentAmount / goal.target_amount) * 100) : 0);

  async function handleWalletChange(newWalletId: string) {
    if (!goal) return;
    await updateGoal(goal.id, { wallet_id: newWalletId || undefined });
    editingWallet = false;
  }

  async function confirmDelete() {
    if (!goal) return;
    await deleteGoal(goal.id);
    goto('/goals');
  }

  $effect(() => {
    if (showActionModal && !selectedWalletId && $wallets.length > 0) {
      selectedWalletId = goal?.wallet_id || $wallets[0].id;
    }
  });

  function handleAddTrigger() {
    actionType = 'add';
    actionAmount = '10000';
    showActionModal = true;
  }

  function handleCashOutTrigger() {
    actionType = 'cashout';
    actionAmount = '10000';
    showActionModal = true;
  }

  async function handleActionSubmit() {
    if (!goal || !actionAmount || !goal.wallet_id || !selectedWalletId) {
      if (!goal?.wallet_id) alert("Please link a saving source wallet first.");
      if (!selectedWalletId) alert("Please select a wallet for this " + (actionType === 'add' ? 'source' : 'destination'));
      return;
    }
    const amount = Number(actionAmount);
    const savingsWallet = $wallets.find(w => w.id === goal.wallet_id);
    const targetWallet = $wallets.find(w => w.id === selectedWalletId);
    
    if (!isNaN(amount) && amount > 0 && savingsWallet && targetWallet) {
      if (actionType === 'add') {
        // Transfer FROM targetWallet TO savingsWallet
        if (amount > targetWallet.balance) {
          alert(`Insufficient balance in ${targetWallet.name}.`);
          return;
        }
        
        // 1. Decrease source wallet balance
        await updateWallet(targetWallet.id, { balance: targetWallet.balance - amount });
        // 2. Increase savings wallet balance
        await updateWallet(savingsWallet.id, { balance: savingsWallet.balance + amount });

        // 3. Add Transactions (Both sides)
        await addTransaction({
          type: 'expense',
          amount: amount,
          category: 'Tabungan',
          description: `Saved to ${goal.name} (from ${targetWallet.name})`,
          wallet_id: targetWallet.id,
          date: new Date().toISOString().split('T')[0]
        });
        await addTransaction({
          type: 'income',
          amount: amount,
          category: 'Tabungan',
          description: `Savings contribution from ${targetWallet.name}`,
          wallet_id: savingsWallet.id,
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        // Transfer FROM savingsWallet TO targetWallet
        if (amount > savingsWallet.balance) {
          alert(`Insufficient savings in ${savingsWallet.name}.`);
          return;
        }

        // 1. Decrease savings wallet balance
        await updateWallet(savingsWallet.id, { balance: savingsWallet.balance - amount });
        // 2. Increase target wallet balance
        await updateWallet(targetWallet.id, { balance: targetWallet.balance + amount });

        // 3. Add Transactions (Both sides)
        await addTransaction({
          type: 'expense',
          amount: amount,
          category: 'Cashout',
          description: `Cashout from ${goal.name} (to ${targetWallet.name})`,
          wallet_id: savingsWallet.id,
          date: new Date().toISOString().split('T')[0]
        });
        await addTransaction({
          type: 'income',
          amount: amount,
          category: 'Lainnya',
          description: `Withdrawn from ${goal.name} savings`,
          wallet_id: targetWallet.id,
          date: new Date().toISOString().split('T')[0]
        });
      }
      showActionModal = false;
      actionAmount = '';
    }
  }


  const goalActivity = $derived($recentSavingsActivity.filter(tx => tx.description.includes(goal?.name || '')));


  function formatStr(val: number) {
    if (val === undefined || val === null) return '$0.00';
    // The mockup uses standard formatting. We can keep IDR formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // The screenshot uses USD format explicitly. I'll stick to IDR formatting from the app
    }).format(val).replace('$', 'Rp');  // We format with IDR 
  }

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val).replace('Rp', 'Rp ');
  }

  // Derived styling based on goal color
  const color = $derived(goal?.color || '#10b981');

  // Inline editing states
  let editingName = $state(false);
  let editingTarget = $state(false);
  let editingMonthly = $state(false);
  let editingDate = $state(false);

  let tempName = $state('');
  let tempTarget = $state(0);
  let tempMonthly = $state(0);
  let tempDate = $state('');

  async function updateName() {
    if (!goal || !tempName) { editingName = false; return; }
    await updateGoal(goal.id, { name: tempName });
    editingName = false;
  }

  async function updateTarget() {
    if (!goal) { editingTarget = false; return; }
    await updateGoal(goal.id, { target_amount: tempTarget });
    editingTarget = false;
  }

  async function updateMonthly() {
    if (!goal) { editingMonthly = false; return; }
    await updateGoal(goal.id, { monthly_contribution: tempMonthly });
    editingMonthly = false;
  }

  async function updateDate() {
    if (!goal) { editingDate = false; return; }
    await updateGoal(goal.id, { target_date: tempDate || undefined });
    editingDate = false;
  }

  function startEditName() {
    if (!goal) return;
    tempName = goal.name;
    editingName = true;
  }

  function startEditTarget() {
    if (!goal) return;
    tempTarget = goal.target_amount;
    editingTarget = true;
  }

  function startEditMonthly() {
    if (!goal) return;
    tempMonthly = goal.monthly_contribution;
    editingMonthly = true;
  }

  function startEditDate() {
    if (!goal) return;
    tempDate = goal.target_date || '';
    editingDate = true;
  }
</script>

<svelte:head>
  <title>{goal ? goal.name + ' — ' : ''}FinanceRyuu</title>
</svelte:head>

<!-- Check if goal exists -->
{#if !goal}
  <div class="p-8 text-center pt-20">
    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Target Not Found</p>
    <button onclick={() => goto('/goals')} class="mt-4 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 shadow-md">Go Back</button>
  </div>
{:else}
  <div class="px-5 pt-8 pb-24 space-y-8 animate-fade-in max-w-md mx-auto">
    <!-- Top Nav -->
    <div class="flex items-center justify-between px-1">
      <button onclick={() => goto('/goals')} class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-transparent hover:border-slate-100 shadow-sm text-slate-800 hover:scale-105 active:scale-95 transition-all" aria-label="Go back">
        <ArrowLeft size={24} strokeWidth={2.5} />
      </button>

      <button 
        onclick={() => showDeleteModal = true}
        class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-transparent hover:border-red-50 hover:text-red-500 shadow-sm text-slate-300 hover:scale-105 active:scale-95 transition-all"
        aria-label="Delete goal"
      >
        <Trash2 size={20} />
      </button>
    </div>

    <!-- Header Section -->
    <div class="flex items-center gap-5 mt-2">
      <div 
        class="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-soft shrink-0 transition-transform hover:scale-105"
        style="background: {color}15; color: {color}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
      </div>
      <div class="flex-1">
        {#if editingName}
          <input 
            type="text" 
            bind:value={tempName} 
            onblur={updateName}
            onkeydown={(e) => e.key === 'Enter' && updateName()}
            class="text-2xl font-black text-slate-900 tracking-tight bg-slate-50 border-none p-0 focus:ring-0 w-full"
            autofocus
          />
        {:else}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <h1 
            onclick={startEditName}
            class="text-2xl font-black text-slate-900 tracking-tight cursor-pointer hover:bg-slate-50 rounded-lg px-1 -ml-1 transition-colors"
          >
            {goal.name}
          </h1>
        {/if}
        <p class="text-sm font-semibold text-slate-400 mt-1">
          {percentage >= 100 ? 'Completed' : 'Active Target'}
        </p>
      </div>
    </div>

    <!-- Active Savings Card -->
    <div class="space-y-4 pt-4">
      <div class="flex items-center justify-between pl-1">
        <h2 class="text-base font-black text-slate-900 tracking-tight">Active Savings</h2>
        {#if goal.wallet_id}
          {@const linkedWallet = $wallets.find(w => w.id === goal.wallet_id)}
          {#if linkedWallet}
            <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-100/50 rounded-full border border-slate-200/50">
              <WalletIcon size={12} class="text-slate-400" />
              <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">{linkedWallet.name}</span>
            </div>
          {/if}
        {/if}
      </div>
      
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        onclick={startEditTarget}
        class="bg-white rounded-[2rem] p-6 shadow-soft border border-slate-50 space-y-6 relative overflow-hidden transition-all hover:shadow-soft-lg group cursor-pointer"
      >
        <!-- Floating highlight -->
        <div class="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-[40px] opacity-[0.15] pointer-events-none transition-opacity duration-500 group-hover:opacity-30" style="background: {color}"></div>

        <div class="flex items-start justify-between relative z-10">
          <div class="space-y-1.5 flex-1 min-w-0">
            <h3 class="text-3xl font-black text-slate-900 tracking-tighter truncate">{formatCurrency(currentAmount)}</h3>
            {#if editingTarget}
              <div 
                class="flex items-center gap-1"
                onclick={(e) => e.stopPropagation()}
              >
                <span class="text-[13px] font-semibold text-slate-400 shrink-0">Goals: Rp</span>
                <input 
                  type="number" 
                  bind:value={tempTarget} 
                  onblur={updateTarget}
                  onkeydown={(e) => e.key === 'Enter' && updateTarget()}
                  class="text-[13px] font-semibold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full"
                  autofocus
                />
              </div>
            {:else}
              <p 
                class="text-[13px] font-semibold text-slate-400 tracking-wide transition-colors group-hover:text-slate-600"
              >
                Goals: {formatCurrency(goal.target_amount)}
              </p>
            {/if}
          </div>
          
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm" style="background: {color}15; color: {color}">
            <DollarSign size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
          <div 
            class="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
            style="width: {percentage}%; background-color: {color};"
          ></div>
        </div>
      </div>
    </div>


    <!-- Stats Row (Monthly & Date) -->
    <div class="grid grid-cols-2 gap-4">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        onclick={startEditMonthly}
        class="bg-white rounded-[1.5rem] p-5 shadow-soft border border-slate-50 flex flex-col gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background: {color}15; color: {color}">
          <TrendingUp size={16} />
        </div>
        <div class="space-y-0.5">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Saving</p>
          {#if editingMonthly}
            <input 
              type="number" 
              bind:value={tempMonthly} 
              onblur={updateMonthly}
              onkeydown={(e) => e.key === 'Enter' && updateMonthly()}
              class="text-sm font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full"
              autofocus
            />
          {:else}
            <p class="text-sm font-black text-slate-900 tracking-tight">{formatCurrency(goal.monthly_contribution || 0)}</p>
          {/if}
        </div>
      </div>

      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        onclick={startEditDate}
        class="bg-white rounded-[1.5rem] p-5 shadow-soft border border-slate-50 flex flex-col gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background: {color}15; color: {color}">
          <Calendar size={16} />
        </div>
        <div class="space-y-0.5">
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Date</p>
          {#if editingDate}
            <input 
              type="date" 
              bind:value={tempDate} 
              onblur={updateDate}
              onchange={updateDate}
              onkeydown={(e) => e.key === 'Enter' && updateDate()}
              class="text-sm font-black text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full"
              autofocus
            />
          {:else}
            <p class="text-sm font-black text-slate-900 tracking-tight">
              {goal.target_date ? new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(new Date(goal.target_date)) : 'Not Set'}
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Actions Row -->
    <div class="flex gap-4">
      <button 
        onclick={handleCashOutTrigger}
        class="flex-1 py-4 flex items-center justify-center gap-2.5 rounded-[1.25rem] font-black transition-all hover:opacity-80 active:scale-95 shadow-sm text-sm"
        style="background: {color}15; color: {color}"
      >
        <ArrowDownLeft size={18} strokeWidth={3} />
        Cash Out
      </button>

      <button 
        onclick={handleAddTrigger}
        class="flex-1 py-4 flex items-center justify-center gap-2.5 rounded-[1.25rem] font-black transition-all hover:scale-[1.03] hover:shadow-xl active:scale-95 shadow-md text-white text-sm"
        style="background: {color}"
      >
        <Plus size={18} strokeWidth={3} />
        Add
      </button>
    </div>

    <!-- Saving Source (Interactive) -->
    <div class="animate-fade-in" style="animation-delay: 0.1s">
      {#if editingWallet}
        <div class="bg-white rounded-[1.5rem] p-5 shadow-soft border border-indigo-100/50 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Link Saving Source</p>
            <button onclick={() => editingWallet = false} class="text-[9px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">Cancel</button>
          </div>
          <div class="relative">
            <select 
              value={goal.wallet_id || ''}
              onchange={(e: any) => handleWalletChange(e.target.value)}
              class="w-full bg-slate-50 border-2 border-transparent focus:brightness-[0.98] focus:border-indigo-100/50 rounded-[1.25rem] py-4 pl-12 pr-10 text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="">No Wallet Linked</option>
              {#each $wallets as w}
                <option value={w.id}>{w.name} — {formatCurrency(w.balance)}</option>
              {/each}
            </select>
            <div class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <WalletIcon size={18} />
            </div>
            <div class="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>
      {:else}
        {#if goal.wallet_id}
          {@const linkedWallet = $wallets.find(w => w.id === goal.wallet_id)}
          {#if linkedWallet}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              onclick={() => editingWallet = true}
              class="bg-white rounded-[1.5rem] p-5 shadow-soft border border-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all group"
            >
              <div class="flex items-center gap-4">
                <div 
                  class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110" 
                  style="background: {linkedWallet.color}15; color: {linkedWallet.color}"
                >
                  <WalletIcon size={20} strokeWidth={2.5} />
                </div>
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saving Source</p>
                    <span class="text-[8px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">CLICK TO CHANGE</span>
                  </div>
                  <p class="text-sm font-black text-slate-900 tracking-tight">{linkedWallet.name}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Available Fund</p>
                <p class="text-sm font-black text-indigo-600 tracking-tight">{formatCurrency(linkedWallet.balance)}</p>
              </div>
            </div>
          {/if}
        {:else}
          <button 
            onclick={() => editingWallet = true}
            class="w-full bg-white/50 border-2 border-dashed border-slate-100 rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-2 hover:bg-white hover:border-indigo-100 transition-all group"
          >
            <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-colors">
              <Plus size={20} />
            </div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Link a Saving Source</p>
          </button>
        {/if}
      {/if}
    </div>

    <!-- Latest Activity -->
    <div class="space-y-4 pt-4">
      <h2 class="text-base font-black text-slate-900 tracking-tight pl-1">Latest Activity</h2>
      
      <div class="space-y-3">
        {#each goalActivity as tx, i}
          <div 
            class="bg-white rounded-[1.5rem] p-5 shadow-soft border border-slate-50 flex items-center justify-between group cursor-default transition-transform hover:-translate-y-0.5"
            style="animation: slide-up 0.5s ease-out {i * 0.1}s both;"
          >
            <div class="flex items-center gap-4">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0" 
                  style="background: {tx.description.startsWith('Saved') ? 'var(--color-soft-blue-50)' : 'var(--color-soft-pink-50)'}; color: {tx.description.startsWith('Saved') ? 'var(--color-soft-blue-500)' : 'var(--color-soft-pink-500)'}"
                >
                  {#if tx.description.startsWith('Saved')}
                    <ArrowUp size={20} strokeWidth={2.5} />
                  {:else}
                    <ArrowDown size={20} strokeWidth={2.5} />
                  {/if}
                </div>
                <div class="space-y-0.5">
                  <p class="text-sm font-black text-slate-900 tracking-tight">
                    {tx.description.startsWith('Saved') ? 'Saved' : 'Cash Out'}
                  </p>
                  <p class="text-xs font-semibold text-slate-400 mt-0.5">
                    {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(tx.date))}
                  </p>
                </div>
            </div>
            <p class="text-sm font-black text-slate-900 tracking-tighter" style="color: {tx.description.startsWith('Saved') ? color : 'var(--color-soft-pink-500)'}">
              {tx.description.startsWith('Saved') ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
          </div>
        {/each}

        {#if goalActivity.length === 0}
          <div class="py-12 border-2 border-dashed border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center text-center px-6">
            <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">No activity for this target yet</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Custom Action Modal -->
{#if showDeleteModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-fade-in"
    onclick={() => showDeleteModal = false}
  >
    <div 
      class="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-shake relative overflow-hidden text-center"
      onclick={(e) => e.stopPropagation()}
    >
      <div 
        class="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-sm"
      >
        <Trash2 size={32} strokeWidth={2.5} />
      </div>

      <div class="space-y-2 mb-8">
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Delete Target?</h2>
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Are you sure you want to delete <span class="text-slate-900">"{goal?.name}"</span>? This action cannot be undone.
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <button 
          onclick={confirmDelete}
          class="w-full py-4 bg-red-500 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
        >
          Confirm Delete
        </button>
        <button 
          onclick={() => showDeleteModal = false}
          class="w-full py-4 bg-slate-50 text-slate-400 rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-slate-100/80 transition-all hover:text-slate-600"
        >
          Nevermind
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showActionModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in"
    onclick={() => showActionModal = false}
  >
    <div 
      class="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-slide-up relative overflow-hidden"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Background Ornament -->
      <div class="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-10" style="background: {color}"></div>

      <div class="space-y-8 relative z-10">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">
            {actionType === 'add' ? 'Add Savings' : 'Cash Out'}
          </h2>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Enter the amount to {actionType === 'add' ? 'add to your goal' : 'withdraw from your savings'}
          </p>
        </div>

        <div class="space-y-4">
          <div class="relative group">
            <span class="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">Rp</span>
            <input 
              type="number" 
              bind:value={actionAmount} 
              placeholder="0" 
              class="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 rounded-[1.5rem] py-5 pl-14 pr-6 text-xl font-black text-slate-900 focus:outline-none transition-all"
              autofocus
            />
          </div>

          <!-- Linked Wallet Info -->
          {#if goal?.wallet_id}
            {@const wallet = $wallets.find(w => w.id === goal?.wallet_id)}
            {#if wallet}
              <div class="flex flex-col gap-2 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                <div class="flex items-center justify-between">
                  <p class="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Goal Savings Wallet</p>
                  <span class="text-[10px] font-black text-indigo-600">{formatCurrency(wallet.balance)}</span>
                </div>
                <div class="flex items-center gap-2">
                  <WalletIcon size={14} class="text-indigo-400" />
                  <span class="text-xs font-black text-slate-900">{wallet.name}</span>
                </div>
              </div>
            {/if}
          {:else}
            <div class="flex items-center gap-2 px-6 py-3 bg-red-50 rounded-2xl border border-red-100">
               <span class="text-[10px] font-bold text-red-500">No Saving Source Linked!</span>
            </div>
          {/if}

          <!-- Directional Arrow -->
          <div class="flex justify-center -my-2 relative z-20">
            <div class="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-indigo-500">
              {#if actionType === 'add'}
                <ArrowDown size={16} strokeWidth={3} />
              {:else}
                <ArrowUp size={16} strokeWidth={3} />
              {/if}
            </div>
          </div>

          <!-- Transaction Partner Wallet -->
          <div class="space-y-3">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              {actionType === 'add' ? 'Take Money from' : 'Send Money to'}
            </p>
            <div class="relative">
              <div class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                <WalletIcon size={18} />
              </div>
              <select 
                bind:value={selectedWalletId}
                class="w-full bg-slate-50 border-2 border-transparent focus:brightness-[0.98] focus:border-indigo-100/50 rounded-[1.25rem] py-4 pl-12 pr-10 text-sm font-black text-slate-900 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select Wallet</option>
                {#each $wallets.filter(w => w.id !== goal?.wallet_id) as w}
                  <option value={w.id}>{w.name} — {formatCurrency(w.balance)}</option>
                {/each}
              </select>
              <div class="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          <div class="flex gap-4 pt-2">
            <button 
              onclick={() => showActionModal = false}
              class="flex-1 py-4 rounded-[1.25rem] font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onclick={handleActionSubmit}
              class="flex-none px-8 py-4 rounded-[1.25rem] font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-sm"
              style="background: {color}"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}


<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes shake {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-4px); }
    75% { transform: translateY(4px); }
  }
  .animate-shake { animation: shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
</style>
