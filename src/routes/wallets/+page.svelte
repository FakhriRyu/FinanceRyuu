<script lang="ts">
  import { onMount } from 'svelte';
  import { wallets, loading, fetchWallets, deleteWallet } from '$lib/stores';
  import { Plus, Wallet as WalletIcon, Trash2, Edit2, Landmark, CreditCard, Banknote, PiggyBank, ArrowLeft, MoreHorizontal } from 'lucide-svelte';
  import WalletModal from '$lib/components/WalletModal.svelte';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';

  let showModal = $state(false);
  let editingWallet = $state<any>(null);

  onMount(() => {
    fetchWallets();
  });

  function openAddModal() {
    editingWallet = null;
    showModal = true;
  }

  function openEditModal(wallet: any) {
    editingWallet = wallet;
    showModal = true;
  }

  const typeIcons: Record<string, any> = {
    bank: Landmark,
    cash: Banknote,
    'e-wallet': CreditCard,
    savings: PiggyBank
  };

  const typeLabels: Record<string, string> = {
    bank: 'Bank Account',
    cash: 'Cash Fund',
    'e-wallet': 'Digital Wallet',
    savings: 'Savings'
  };

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val).replace('Rp', 'Rp ');
  }
</script>

<svelte:head>
  <title>Wallets — FinanceRyuu</title>
</svelte:head>

<div class="px-5 pt-8 pb-24 space-y-10 animate-fade-in max-w-4xl mx-auto">
  <!-- Top Nav & Header -->
  <div class="space-y-6">
    <button 
      onclick={() => goto('/')} 
      class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-800 hover:scale-105 active:scale-95 transition-all"
    >
      <ArrowLeft size={24} strokeWidth={2.5} />
    </button>

    <div class="flex items-end justify-between px-1">
      <div class="space-y-1">
        <p class="text-[10px] font-black text-soft-blue-500 uppercase tracking-[0.3em]">MANAGE FUNDS</p>
        <h1 class="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">My Wallets</h1>
      </div>
      
      <button 
        onclick={openAddModal}
        class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center transition-all active:scale-90 hover:shadow-soft-lg group"
      >
        <Plus size={24} class="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  </div>

  {#if $loading && $wallets.length === 0}
    <div class="flex flex-col items-center justify-center py-24 space-y-4">
      <div class="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Synchronizing...</p>
    </div>
  {:else if $wallets.length === 0}
    <div class="py-24 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center px-8 space-y-6 bg-slate-50/30">
      <div class="w-20 h-20 rounded-[2rem] bg-white shadow-soft flex items-center justify-center text-slate-300">
        <WalletIcon size={40} />
      </div>
      <div class="space-y-2">
        <h2 class="text-xl font-black text-slate-900 tracking-tight">No Wallets Found</h2>
        <p class="text-xs font-semibold text-slate-400 max-w-xs mx-auto leading-relaxed">
          Start by adding an account to track your finances across different platforms.
        </p>
      </div>
      <button 
        onclick={openAddModal}
        class="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all active:scale-95"
      >
        Add Your First Wallet
      </button>
    </div>
  {:else}
    <!-- Wallets Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
      {#each $wallets as wallet, i (wallet.id)}
        {@const Icon = typeIcons[wallet.type] || WalletIcon}
        <div 
          class="relative h-60 rounded-[2.5rem] p-8 text-white overflow-hidden shadow-2xl transition-all hover:-translate-y-2 hover:shadow-soft-lg group"
          style="background: {wallet.color}; animation: slide-up 0.5s ease-out {i * 0.1}s both;"
        >
          <!-- Card Decorative Patterns -->
          <div class="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700"></div>
          <div class="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>
          
          <!-- Gloss Effect -->
          <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

          <div class="relative h-full flex flex-col justify-between">
            <!-- Top Part -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <div class="space-y-0.5">
                  <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 leading-none">{typeLabels[wallet.type]}</p>
                  <h3 class="text-lg font-black tracking-tight leading-none">{wallet.name}</h3>
                </div>
              </div>

              <!-- Action Menu (Visible on hover or tapping) -->
              <div class="flex gap-1">
                <button 
                  onclick={() => openEditModal(wallet)}
                  class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all"
                  aria-label="Edit Wallet"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onclick={() => { if(confirm('Hapus dompet ini?')) deleteWallet(wallet.id) }}
                  class="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-red-500/40 transition-all"
                  aria-label="Delete Wallet"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <!-- Card Chip Placeholder (The Look) - Real Gold Design -->
            <div class="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-amber-500 to-amber-400 p-[1px] shadow-inner relative overflow-hidden mt-2">
              <!-- Chip Lines Grid -->
              <div class="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[1px]">
                <div class="border-r border-b border-black/10"></div>
                <div class="border-r border-b border-black/10"></div>
                <div class="border-b border-black/10"></div>
                <div class="border-r border-black/10"></div>
                <div class="border-r border-black/10"></div>
                <div class=""></div>
              </div>
              <!-- Inner Gloss -->
              <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
            </div>

            <!-- Bottom Part -->
            <div class="space-y-1">
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Current Balance</p>
              <div class="flex items-baseline gap-2">
                <p class="text-3xl lg:text-4xl font-black tracking-tighter">
                  {formatCurrency(wallet.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <WalletModal 
    wallet={editingWallet} 
    onClose={() => showModal = false} 
  />
{/if}

<style>
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
  .stagger > * {
    opacity: 0;
  }
</style>
