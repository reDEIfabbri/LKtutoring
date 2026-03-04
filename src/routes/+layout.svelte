<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		window.location.href = '/'; // Force a hard reload to clear state
	}
</script>

<div class="app-container">
	{#if data.session}
		<nav class="navbar">
			<div class="logo">LK Tutoring</div>
			<div class="links">
				<a href="/" class:active={$page.url.pathname === '/'}>Dashboard</a>
				<a href="/schedule" class:active={$page.url.pathname === '/schedule'}>Schedule</a>
				<a href="/chat" class:active={$page.url.pathname === '/chat'}>Chat</a>
			</div>
			<div class="user-actions">
				<span class="email">{data.user?.email}</span>
				<button on:click={handleLogout}>Log Out</button>
			</div>
		</nav>
	{/if}

	<main class="content">
		<slot />
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		background-color: #f4f6f8;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.navbar {
		background-color: #ffffff;
		border-bottom: 1px solid #e1e4e8;
		padding: 0 2rem;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 2px 4px rgba(0,0,0,0.02);
	}

	.logo {
		font-weight: bold;
		font-size: 1.25rem;
		color: #007bff;
	}

	.links {
		display: flex;
		gap: 2rem;
	}

	.links a {
		text-decoration: none;
		color: #495057;
		font-weight: 500;
		padding: 0.5rem 0;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.links a:hover {
		color: #007bff;
	}

	.links a.active {
		color: #007bff;
		border-bottom-color: #007bff;
	}

	.user-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.email {
		font-size: 0.9rem;
		color: #6c757d;
	}

	button {
		background: none;
		border: 1px solid #ced4da;
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		cursor: pointer;
		color: #495057;
		font-size: 0.9rem;
	}

	button:hover {
		background-color: #f8f9fa;
		color: #212529;
	}

	.content {
		flex: 1;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}
</style>