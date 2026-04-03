<script lang="ts">
  import { addBudget, budgets } from '$lib/stores';
  import { EXPENSE_CATEGORIES } from '$lib/types';
  import { X, Plus, Target } from 'lucide-svelte';

  let { show = $bindable(false) } = $props();

  let amount = $state('');
  let category = $state('');
  let color = $state('#0ea5e9');
  let submitting = $state(false);

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

  // Filter out categories that already have a budget
  const availableCategories = $derived(
    EXPENSE_CATEGORIES.filter(cat => !$budgets.some(b => b.category === cat))
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!amount || !category) return;

    submitting = true;
    await addBudget({
      category,
      amount: parseFloat(amount),
      color
    });

    // Reset form
    amount = '';
    category = '';
    color = '#0ea5e9';
    submitting = false;
    show = false;
  }

  function close() {
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
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fade-in"
    onclick={close}
    onkeydown={(e) => e.key === 'Escape' && close()}
  >
    <!-- Modal -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="glass-strong w-full sm:max-w-md rounded-t-[2.5rem] rounded-b-none sm:rounded-2xl p-8 sm:p-10 animate-modal-slide-up shadow-2xl transition-all max-h-[92vh] overflow-y-auto overscroll-contain"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
    >
      <!-- Drag Handle for Mobile -->
      <div class="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden"></div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-10">
        <div class="flex items-center gap-4">
          <div class="p-3 rounded-2xl bg-soft-blue-50 text-soft-blue-500">
            <Target class="w-6 h-6" />
          </div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">Set Budget</h2>
        </div>
        <button onclick={close} class="p-2 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all">
          <X class="w-6 h-6" />
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-8">
        <!-- Category Selection -->
        <div>
          <label for="budget-category" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Select Category</label>
          <select 
            id="budget-category" 
            bind:value={category} 
            required 
            class="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-soft-blue-500/10 transition-all"
          >
            <option value="">Choose Category...</option>
            {#each availableCategories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
          {#if availableCategories.length === 0}
            <p class="mt-2 text-[10px] text-soft-pink-500 font-bold uppercase tracking-widest">All categories already have a budget.</p>
          {/if}
        </div>

        <!-- Amount -->
        <div>
          <label for="budget-amount" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Monthly Target (IDR)</label>
          <input
            id="budget-amount"
            type="number"
            bind:value={amount}
            placeholder="0"
            required
            min="1000"
            class="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-2xl font-black tracking-tighter shadow-sm focus:outline-none focus:ring-4 focus:ring-soft-blue-500/10 transition-all"
          />
        </div>

        <!-- Color Selection -->
        <div class="space-y-3">
          <span class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Label Color</span>
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

        <!-- Info Card -->
        <div class="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100">
          <p class="text-xs text-slate-500 leading-relaxed font-medium">
            <span class="font-black text-slate-900 uppercase tracking-widest text-[10px] block mb-1">Pro Tip:</span> 
            Setting realistic monthly budgets helps you stay on track and build long-term wealth.
          </p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          disabled={submitting || !amount || !category}
          class="w-full bg-slate-900 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          {#if submitting}
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Saving...
          {:else}
            <Plus class="w-4 h-4 stroke-[3]" />
            Save Budget
          {/if}
        </button>
      </form>
    </div>
  </div>
{/if}
