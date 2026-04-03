<script lang="ts">
  import { addTransaction, wallets, fetchWallets } from '$lib/stores';
  import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '$lib/types';
  import type { TransactionType } from '$lib/types';
  import { X, Plus, Wallet as WalletIcon } from 'lucide-svelte';
  import { format } from 'date-fns';
  import { onMount } from 'svelte';

  let { show = $bindable(false) } = $props();

  let type = $state<TransactionType>('expense');
  let amount = $state('');
  let category = $state('');
  let description = $state('');
  let date = $state(format(new Date(), 'yyyy-MM-dd'));
  let wallet_id = $state('');
  let submitting = $state(false);

  const categories = $derived(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES);

  onMount(() => {
    if ($wallets.length === 0) fetchWallets();
  });

  // Reset category when type changes
  $effect(() => {
    type;
    category = '';
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!amount || !category || !description) return;

    submitting = true;
    await addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
      wallet_id: wallet_id || undefined
    });

    // Reset form
    amount = '';
    category = '';
    description = '';
    wallet_id = '';
    date = format(new Date(), 'yyyy-MM-dd');
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
      class="glass-strong w-full sm:max-w-md rounded-t-[2.5rem] rounded-b-none sm:rounded-2xl p-8 sm:p-8 animate-modal-slide-up shadow-2xl transition-all max-h-[92vh] overflow-y-auto overscroll-contain"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
    >
      <!-- Drag Handle for Mobile -->
      <div class="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-6 sm:hidden"></div>

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-xl font-black text-slate-900 tracking-tight">Tambah Transaksi</h2>
        <button onclick={close} class="p-2 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all">
          <X class="w-6 h-6" />
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-6">
        <!-- Type Toggle -->
        <div class="flex rounded-2xl bg-slate-50 border border-slate-100 p-1.5 gap-1.5">
          <button
            type="button"
            onclick={() => (type = 'expense')}
            class="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300
              {type === 'expense' 
                ? 'bg-soft-pink-500 text-white shadow-lg shadow-soft-pink-500/25' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}"
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onclick={() => (type = 'income')}
            class="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300
              {type === 'income' 
                ? 'bg-soft-blue-500 text-white shadow-lg shadow-soft-blue-500/25' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}"
          >
            Pemasukan
          </button>
        </div>

        <!-- Amount -->
        <div>
          <label for="tx-amount" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Jumlah (Rp)</label>
          <input
            id="tx-amount"
            type="number"
            bind:value={amount}
            placeholder="0"
            required
            min="1"
            class="input-ocean text-xl font-bold py-4"
          />
        </div>

        <!-- Category & Date Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="tx-category" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Kategori</label>
            <input
              id="tx-category"
              type="text"
              bind:value={category}
              required
              class="input-ocean font-medium"
              placeholder="Pilih atau ketik..."
              list="category-options"
            />
            <datalist id="category-options">
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </datalist>
          </div>

          <div>
            <label for="tx-date" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Tanggal</label>
            <input
              id="tx-date"
              type="date"
              bind:value={date}
              required
              class="input-ocean font-medium"
            />
          </div>
        </div>

        <!-- Wallet Selection -->
        <div>
          <label for="tx-wallet" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Simpan Ke Dompet</label>
          <select id="tx-wallet" bind:value={wallet_id} class="input-ocean font-medium">
            <option value="">Pilih Dompet (Opsional)</option>
            {#each $wallets as w}
              <option value={w.id}>{w.name} ({new Intl.NumberFormat('id-ID').format(w.balance)})</option>
            {/each}
          </select>
        </div>

        <!-- Description -->
        <div>
          <label for="tx-desc" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Deskripsi</label>
          <input
            id="tx-desc"
            type="text"
            bind:value={description}
            placeholder="Membeli kopi..."
            required
            class="input-ocean font-medium"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          disabled={submitting || !amount || !category || !description}
          class="btn-ocean w-full justify-center py-4 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-ocean-500/20"
        >
          {#if submitting}
            <span class="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
            Menyimpan...
          {:else}
            <Plus class="w-5 h-5 stroke-[2.5]" />
            Simpan Transaksi
          {/if}
        </button>
      </form>
    </div>
  </div>
{/if}
