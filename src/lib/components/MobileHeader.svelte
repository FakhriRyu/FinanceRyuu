<script lang="ts">
  import { Wallet, User as UserIcon, LogOut } from 'lucide-svelte';
  import { user } from '$lib/stores';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let showMenu = $state(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }

  // Simple click outside handler
  function toggleMenu(e: MouseEvent) {
    e.stopPropagation();
    showMenu = !showMenu;
  }
</script>

<svelte:window onclick={() => (showMenu = false)} />

<header class="lg:hidden sticky top-0 z-50 w-full px-6 py-5 flex items-center justify-between bg-white border-b border-slate-50">
  <div class="flex items-center gap-4">
    <div class="w-11 h-11 rounded-2xl bg-soft-blue-500 flex items-center justify-center shadow-lg shadow-soft-blue-500/20">
      <Wallet class="w-5 h-5 text-white" />
    </div>
    <div class="flex flex-col -space-y-0.5">
      <span class="text-lg font-black tracking-tighter text-slate-900">FinanceRyuu</span>
      <span class="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Personal</span>
    </div>
  </div>

  <div class="relative">
    <button 
      onclick={toggleMenu}
      class="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm active:scale-95 transition-transform"
    >
      {#if $user?.user_metadata?.avatar_url}
        <img src={$user.user_metadata.avatar_url} alt="Avatar" class="w-full h-full object-cover" />
      {:else}
        <UserIcon size={20} class="text-slate-300" />
      {/if}
    </button>

    {#if showMenu}
      <div 
        class="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-3xl shadow-soft-lg p-6 lg:p-4 z-50 animate-fade-in"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {#if $user}
          <div class="flex items-center gap-4 mb-6 border-b border-slate-50 pb-6">
            <div class="w-12 h-12 rounded-full bg-soft-blue-50 flex items-center justify-center text-soft-blue-500 shrink-0">
               <UserIcon size={24} />
            </div>
            <div class="flex flex-col min-w-0">
              <p class="text-sm font-black text-slate-900 truncate tracking-tight">{$user.email?.split('@')[0]}</p>
              <p class="text-[10px] text-slate-400 font-bold truncate tracking-wide">{$user.email}</p>
            </div>
          </div>

          <button 
            onclick={handleLogout}
            class="flex items-center gap-4 w-full p-4 rounded-2xl text-slate-400 hover:text-soft-pink-500 hover:bg-soft-pink-50 transition-all font-bold text-xs uppercase tracking-widest group"
          >
            <LogOut size={18} class="group-hover:translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        {/if}
      </div>
    {/if}
  </div>
</header>


