<script lang="ts">
  import SummaryCards from '$lib/components/SummaryCards.svelte';
  import Insights from '$lib/components/Insights.svelte';
  import TransactionModal from '$lib/components/TransactionModal.svelte';
  import { getGreeting } from '$lib/utils';
  import { Plus } from 'lucide-svelte';
  import { user } from '$lib/stores';

  let showModal = $state(false);
  const displayName = $derived($user?.email?.split('@')[0] ?? 'User');
</script>

<svelte:head>
  <title>Dashboard — FinanceRyuu</title>
</svelte:head>

<div class="space-y-12 animate-fade-in pb-12">
  <div class="space-y-1 px-4 pt-6">
    <p class="text-xs lg:text-sm font-bold text-soft-blue-500 uppercase tracking-[0.3em]">{getGreeting()}</p>
    <h1 class="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter">
      {displayName}
    </h1>
  </div>

  <!-- Summary Cards (The Grid) -->
  <SummaryCards />

  <!-- Smart Insights -->
  <Insights />
</div>

<TransactionModal bind:show={showModal} />

<!-- Floating Action Button -->
<button 
  onclick={() => (showModal = true)}
  class="fixed bottom-28 lg:bottom-12 right-6 lg:right-12 w-18 h-18 rounded-[1.5rem] bg-gradient-to-br from-soft-pink-500 to-soft-blue-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 shadow-soft-blue-500/25 hover:shadow-soft-blue-500/40 transition-all z-40 group"
>
  <div class="group-hover:rotate-90 transition-transform duration-500">
    <Plus size={32} strokeWidth={3} />
  </div>
</button>
