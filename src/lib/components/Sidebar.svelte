<script lang="ts">
  import { page } from '$app/state';
  import { 
    LogOut, 
    User as UserIcon,
    Wallet
  } from 'lucide-svelte';
  import { user } from '$lib/stores';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { MENU_ITEMS } from '$lib/constants';

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<!-- Desktop Sidebar -->
<aside class="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 shrink-0 fixed inset-y-0 left-0 z-40 transition-colors duration-400">
  <!-- Logo -->
  <div class="flex items-center gap-4 px-8 py-10">
    <div class="w-12 h-12 rounded-2xl bg-soft-blue-500 flex items-center justify-center shadow-lg shadow-soft-blue-500/20">
      <Wallet class="w-6 h-6 text-white" />
    </div>
    <div>
      <h1 class="text-xl font-black text-slate-900 tracking-tighter">FinanceRyuu</h1>
      <p class="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">Manager</p>
    </div>
  </div>

  <!-- Nav Links -->
  <nav class="flex-1 px-4 py-4 space-y-3">
    {#each MENU_ITEMS as item}
      {@const active = page.url.pathname === item.href}
      <a
        href={item.href}
        class="flex items-center gap-5 px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 group
          {active
            ? 'bg-soft-blue-50 text-soft-blue-600'
            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}"
      >
        <div class="p-2 transition-colors {active ? 'text-soft-blue-500' : 'text-slate-300 group-hover:text-slate-900'}">
          <item.icon size={20} class="transition-transform group-hover:scale-110" />
        </div>
        <span class="tracking-tight">{item.name}</span>
      </a>
    {/each}
  </nav>

  <!-- User profile & Logout -->
  <div class="p-8 space-y-6">
    {#if $user}
      <div class="flex items-center gap-4 px-2">
        <div class="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm">
          {#if $user.user_metadata?.avatar_url}
            <img src={$user.user_metadata.avatar_url} alt="Avatar" class="w-full h-full object-cover" />
          {:else}
            <UserIcon size={20} class="text-slate-300" />
          {/if}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-black truncate text-slate-900">{$user.email?.split('@')[0]}</p>
          <p class="text-[10px] text-slate-400 font-bold truncate">{$user.email}</p>
        </div>
      </div>
    {/if}
    
    <div class="space-y-1">
      <button 
        onclick={handleLogout}
        class="flex items-center gap-4 w-full px-5 py-3.5 text-slate-400 hover:text-soft-pink-500 hover:bg-soft-pink-50 rounded-2xl transition-all group"
      >
        <LogOut size={18} />
        <span class="text-xs font-bold uppercase tracking-widest">Sign Out</span>
      </button>
    </div>
  </div>
</aside>

