<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import MobileHeader from '$lib/components/MobileHeader.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { fetchTransactions, fetchWallets, fetchBudgets, fetchGoals, user } from '$lib/stores';
  import { onMount } from 'svelte';
  import favicon from '$lib/assets/favicon.svg';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let { children } = $props();

  async function loadData() {
    await Promise.all([
      fetchTransactions(),
      fetchWallets(),
      fetchBudgets(),
      fetchGoals()
    ]);
  }

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    user.set(session?.user ?? null);

    if (session) {
      loadData();
    } else if (page.url.pathname !== '/login') {
      goto('/login');
    }

    supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      user.set(u);
      
      if (u) {
        loadData();
        if (page.url.pathname === '/login') goto('/');
      } else if (page.url.pathname !== '/login') {
        goto('/login');
      }
    });
  });

  import { pwaInfo } from 'virtual:pwa-info';
</script>

<svelte:head>
  {@html pwaInfo?.webManifest?.linkTag}
  <link rel="icon" href={favicon} />
</svelte:head>

{#if page.url.pathname !== '/login'}
  <div class="min-h-screen flex flex-col lg:flex-row">
    <Sidebar />
    <MobileHeader />

    <!-- Main content area -->
    <main class="flex-1 lg:ml-64 pb-36 lg:pb-0 min-h-screen">
      <div class="p-4 lg:p-8 max-w-7xl mx-auto">
        {@render children()}
      </div>
    </main>

    <BottomNav />
  </div>
{:else}
  {@render children()}
{/if}
