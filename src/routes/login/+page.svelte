<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { Auth } from '@supabase/auth-ui-svelte';
  import { ThemeSupa } from '@supabase/auth-ui-shared';

  let origin = $state(browser ? window.location.origin : '');

  onMount(async () => {
    origin = window.location.origin;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      goto('/');
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        goto('/');
      }
    });
  });

  const appearance = {
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: '#0ea5e9',
          brandAccent: '#38bdf8',
          inputText: '#f8fafc',
          inputBorder: '#334155',
          inputBackground: '#1e293b',
          inputLabelText: '#94a3b8',
          inputPlaceholder: '#64748b',
        },
        space: {
          inputPadding: '12px 16px',
          buttonPadding: '12px 16px',
        },
        radii: {
          borderRadiusButton: '12px',
          buttonBorderRadius: '12px',
          inputBorderRadius: '12px',
        },
      },
    },
  };
</script>

<svelte:head>
  <title>Masuk — FinanceRyuu</title>
  <meta name="description" content="Masuk ke FinanceRyuu untuk mengelola keuangan Anda" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4">
  <!-- Decorative Orbs -->
  <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>

  <div class="card p-8 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl relative z-10">
    <div class="flex flex-col items-center mb-8">
      <div class="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
      </div>
      <h1 class="text-3xl font-bold text-white tracking-tight">FinanceRyuu</h1>
      <p class="text-slate-400 mt-2">Masuk untuk mengelola keuangan Anda</p>
    </div>

    <Auth
      supabaseClient={supabase}
      {appearance}
      redirectTo={origin}
      localization={{
        variables: {
          sign_in: {
            email_label: 'Email',
            password_label: 'Password',
            button_label: 'Masuk Sekarang',
            link_text: 'Sudah punya akun? Masuk',
            social_provider_text: 'Masuk dengan {{provider}}',
          },
          sign_up: {
            email_label: 'Email',
            password_label: 'Password',
            button_label: 'Daftar Sekarang',
            link_text: 'Belum punya akun? Daftar',
            social_provider_text: 'Daftar dengan {{provider}}',
          },
        }
      }}
    />
  </div>
</div>

<style>
  :global(.supabase-auth-ui_ui-button) {
    font-weight: 600 !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  :global(.supabase-auth-ui_ui-button:hover) {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3) !important;
  }
  :global(.supabase-auth-ui_ui-input) {
    background: rgba(15, 23, 42, 0.8) !important;
  }
</style>
