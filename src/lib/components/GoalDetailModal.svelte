<script lang="ts">
  import type { GoalUsage } from '$lib/types';
  import { X, TrendingUp, AlertTriangle, Target, Trash2, Edit3, CheckCircle2 } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils';
  import { deleteGoal } from '$lib/stores';

  let { show = $bindable(false), goal, onEdit }: { show: boolean, goal: GoalUsage | null, onEdit: () => void } = $props();

  const color = $derived(goal ? goal.color : '#64748b');
  const percentage = $derived(goal ? Math.min(100, goal.percentage) : 0);
  const isCompleted = $derived(goal ? goal.current_amount >= goal.target_amount : false);

  function close() { show = false; }

  async function handleDelete() {
    if (!goal) return;
    if (confirm(`Hapus target "${goal.name}"?`)) {
      await deleteGoal(goal.id);
      show = false;
    }
  }

  function handleEdit() {
    if (!goal) return;
    show = false;
    onEdit();
  }
</script>

{#if show && goal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-slide-up shadow-soft-lg border border-slate-100" onclick={e => e.stopPropagation()} onkeydown={() => {}}>
      
      <!-- Header with Color -->
      <div class="h-32 relative flex items-end px-8 pb-6" style="background-color: {color}">
         <!-- Background Blobs -->
         <div class="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20 blur-2xl"></div>
         <div class="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-black/10 blur-2xl"></div>

         <button onclick={close} class="absolute top-6 right-6 p-2 rounded-full bg-black/10 text-white hover:bg-black/20 transition-all">
           <X size={20} />
         </button>
         
         <div class="relative z-10 space-y-1">
           <p class="text-[10px] font-black text-white/70 uppercase tracking-widest">Financial Target</p>
           <h2 class="text-2xl font-black text-white tracking-tighter truncate">{goal.name}</h2>
         </div>
      </div>

      <div class="p-8 space-y-8">
        <!-- Main Stats -->
        <div class="grid grid-cols-2 gap-8">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <Target size={14} class="text-slate-400" />
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</p>
            </div>
            <p class="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(goal.target_amount)}</p>
          </div>
          <div class="space-y-1.5 text-right">
             <div class="flex items-center justify-end gap-2">
              <TrendingUp size={14} class="text-slate-400" />
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collected</p>
            </div>
            <p class="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(goal.current_amount)}</p>
          </div>
        </div>

        <!-- Progress Bar Section -->
        <div class="space-y-4">
          <div class="flex justify-between items-end px-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</p>
            <div class="flex items-center gap-2">
              {#if isCompleted}
                <CheckCircle2 size={14} class="text-emerald-500" />
              {/if}
              <p class="text-lg font-black {isCompleted ? 'text-emerald-500' : 'text-slate-900'} tracking-tighter">
                {goal.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div class="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
            <div 
              class="h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
              style="width: {percentage}%; background-color: {color}"
            ></div>
          </div>
        </div>

        <!-- Remaining Insight Card -->
        <div class="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
            <p class="text-lg font-black text-slate-900 tracking-tight">{formatCurrency(goal.remaining_amount)}</p>
          </div>
          {#if isCompleted}
             <div class="bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
               Completed
             </div>
          {:else}
             <div class="bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
               {goal.estimated_months ? `${goal.estimated_months}mo left` : 'On Track'}
             </div>
          {/if}
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button 
            onclick={handleEdit}
            class="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
          >
            <Edit3 size={14} class="stroke-[3]" />
            Edit
          </button>
          <button 
            onclick={handleDelete}
            class="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-soft-pink-500 font-black text-[10px] uppercase tracking-widest bg-soft-pink-50 hover:bg-soft-pink-100 transition-all border border-soft-pink-50"
          >
            <Trash2 size={14} class="stroke-[3]" />
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
</style>
