<script lang="ts">
  import { onMount } from 'svelte';
  import { addWallet, updateWallet, loading } from '$lib/stores';
  import { X, Landmark, Banknote, CreditCard, PiggyBank, Briefcase, Hash } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import type { WalletType } from '$lib/types';

  let { wallet = null, onClose } = $props();

  let name = $state('');
  let type = $state<WalletType>('bank');
  let initialBalance = $state(0);
  let color = $state('#3b82f6');
  let icon = $state('wallet');

  $effect(() => {
    if (wallet) {
      name = wallet.name;
      type = wallet.type;
      initialBalance = wallet.initial_balance;
      color = wallet.color;
      icon = wallet.icon;
    } else {
      name = '';
      type = 'bank';
      initialBalance = 0;
      color = '#3b82f6';
      icon = 'wallet';
    }
  });

  const types = [
    { value: 'bank', label: 'Bank', icon: Landmark },
    { value: 'cash', label: 'Tunai', icon: Banknote },
    { value: 'e-wallet', label: 'E-Wallet', icon: CreditCard },
    { value: 'savings', label: 'Tabungan', icon: PiggyBank }
  ];

  const colors = [
    '#3b82f6', // blue
    '#06b6d4', // cyan
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#f472b6', // pink
    '#64748b'  // slate
  ];

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name || isNaN(initialBalance)) return;

    if (wallet) {
      await updateWallet(wallet.id, {
        name,
        type,
        initial_balance: Number(initialBalance),
        color,
        icon: type === 'bank' ? 'bank' : type === 'cash' ? 'cash' : type === 'savings' ? 'savings' : 'wallet'
      });
      onClose();
    } else {
      await addWallet({
        name,
        type,
        initial_balance: Number(initialBalance),
        color,
        icon: type === 'bank' ? 'bank' : type === 'cash' ? 'cash' : type === 'savings' ? 'savings' : 'wallet'
      });
      onClose();
    }
  }

  // Close on Escape
  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  $effect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<div
  class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fade-in"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="button"
  tabindex="0"
>
  <!-- Modal -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="glass-strong w-full sm:max-w-xl rounded-t-[2.5rem] rounded-b-none sm:rounded-3xl shadow-2xl transition-all animate-modal-slide-up relative overflow-hidden flex flex-col max-h-[92vh]"
    onclick={(e) => e.stopPropagation()}
    onkeydown={() => {}}
  >
    <!-- Drag Handle for Mobile -->
    <div class="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mt-6 sm:hidden shrink-0"></div>

    <button 
      onclick={onClose}
      class="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 transition-colors z-10"
    >
      <X size={24} />
    </button>

    <div class="overflow-y-auto overscroll-contain p-8 md:p-10">
      <div class="flex items-center gap-4 mb-8">
        <div class="w-14 h-14 bg-soft-blue-50 rounded-2xl flex items-center justify-center">
          <Landmark size={28} class="text-soft-blue-500" />
        </div>
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">{wallet ? 'Ubah Dompet' : 'Tambah Dompet'}</h2>
          <p class="text-slate-400 text-sm font-bold mt-1">Masukan informasi detail dompet Anda.</p>
        </div>
      </div>

      <form onsubmit={handleSubmit} class="space-y-8">
        <!-- Name -->
        <div class="space-y-2">
          <label for="wallet-name" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Nama Dompet</label>
          <div class="group relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-soft-blue-500 transition-colors">
              <Briefcase size={20} />
            </div>
            <input 
              id="wallet-name"
              type="text" 
              bind:value={name}
              placeholder="e.g. BCA Utama, GoPay, Tunai"
              class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-soft-blue-500/50 rounded-2xl outline-none text-slate-900 transition-all font-bold placeholder:text-slate-300"
              required
            />
          </div>
        </div>

        <!-- Initial Balance -->
        <div class="space-y-2">
          <label for="wallet-balance" class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Saldo Awal</label>
          <div class="group relative">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-soft-blue-500 transition-colors">
              <span class="font-bold text-lg">Rp</span>
            </div>
            <input 
              id="wallet-balance"
              type="number" 
              bind:value={initialBalance}
              class="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-100 focus:border-soft-blue-500/50 rounded-2xl outline-none text-slate-900 transition-all font-black text-xl placeholder:text-slate-300"
              required
            />
          </div>
          <p class="text-[9px] text-slate-400 ml-1 tracking-wider uppercase font-bold">Saldo awal akan terpengaruh oleh transaksi.</p>
        </div>

        <!-- Type -->
        <div class="space-y-3">
          <span class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Tipe Sumber Dana</span>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            {#each types as t}
              <button 
                type="button" 
                onclick={() => type = t.value as WalletType}
                class="flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2
                  {type === t.value 
                    ? 'border-soft-blue-500 bg-soft-blue-50 text-soft-blue-600' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100/50'}"
              >
                <t.icon size={24} />
                <span class="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Color -->
        <div class="space-y-3">
          <span class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">Pilih Warna</span>
          <div class="flex flex-wrap gap-3">
            {#each colors as c}
              <button 
                type="button" 
                onclick={() => color = c}
                class="w-10 h-10 rounded-full border border-white transition-all shadow-sm ring-offset-2 ring-offset-transparent
                  {color === c ? 'ring-2 ring-slate-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}"
                style="background-color: {c}"
                aria-label="Pilih warna {c}"
              ></button>
            {/each}
          </div>
        </div>

        <button 
          type="submit"
          disabled={$loading}
          class="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
        >
          {#if $loading}
            <div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>Memproses...</span>
          {:else}
            <span>{wallet ? 'Simpan Perubahan' : 'Buat Dompet Sekarang'}</span>
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  .glass-strong {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
  }

  :global(.dark) .glass-strong {
    background: rgba(15, 23, 42, 0.85);
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
