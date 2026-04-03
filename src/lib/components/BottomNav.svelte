<script lang="ts">
  import { page } from '$app/state';
  import { MENU_ITEMS } from '$lib/constants';
  import { spring } from 'svelte/motion';

  // Calculate position for the active indicator
  let activeIndex = $derived(MENU_ITEMS.findIndex(item => page.url.pathname === item.href));
  
  // Use a spring for smooth motion
  const indicatorPos = spring(0, {
    stiffness: 0.1,
    damping: 0.8
  });

  $effect(() => {
    if (activeIndex !== -1) {
      indicatorPos.set(activeIndex);
    }
  });
</script>

<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-10 pointer-events-none">
  <div class="max-w-md mx-auto h-20 bg-white shadow-soft-lg rounded-[2.5rem] flex items-center justify-around px-2 pointer-events-auto relative overflow-hidden border border-black/5">
    
    {#each MENU_ITEMS as item, i}
      {@const active = activeIndex === i}
      <a 
        href={item.href}
        class="flex flex-col items-center justify-center flex-1 h-full z-10 transition-all duration-300
          {active ? 'text-soft-blue-600' : 'text-slate-300'}"
      >
        <div class="relative flex flex-col items-center gap-1">
          <item.icon 
            size={24} 
            strokeWidth={active ? 3 : 2}
            class="transition-all {active ? 'scale-110' : ''}"
          />
          {#if active}
            <div class="w-1.5 h-1.5 bg-soft-blue-500 rounded-full animate-fade-in"></div>
          {/if}
        </div>
      </a>
    {/each}
  </div>
</nav>

<style>
  /* Removed old styles */
</style>

