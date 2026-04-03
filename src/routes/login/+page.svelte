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

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin
      }
    });
    if (error) console.error('Error logging in with Google:', error.message);
  }

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

    <!-- Google Button (Premium) -->
    <button 
      onclick={signInWithGoogle}
      class="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-white/5 mb-6"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
      </svg>
      Masuk dengan Google
    </button>

    <div class="flex items-center gap-4 mb-6">
      <div class="h-[1px] flex-1 bg-white/10"></div>
      <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">Atau dengan Email</span>
      <div class="h-[1px] flex-1 bg-white/10"></div>
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
