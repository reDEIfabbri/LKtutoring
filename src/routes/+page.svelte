<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { createBrowserClient } from '@supabase/ssr';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import type { PageData } from './$types';

	export let data: PageData;

	let email = '';
	let password = '';
	let message = '';
	let loading = false;

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	async function handleLogin() {
		loading = true;
		message = '';
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			message = `Login failed: ${error.message}`;
			loading = false;
		} else {
			// Reload to update session state
			window.location.reload();
		}
	}
</script>

{#if data.user}
	<!-- DASHBOARD VIEW -->
	<div class="dashboard">
		<header class="welcome-banner">
			<h1>Welcome back!</h1>
			<p>Here is what's happening with your tutoring.</p>
		</header>

		<div class="stats-grid">
			<!-- Next Lesson Card -->
			<div class="card">
				<h2>Next Lesson</h2>
				{#if data.nextLesson}
					<div class="highlight-info">
                        <span class="date">
                            {new Date(data.nextLesson.scheduledAt).toLocaleDateString()}
                        </span>
						<span class="time">
                            {new Date(data.nextLesson.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
					</div>
					<p class="subtitle">
						{data.nextLesson.title} with
						<strong>
							{data.user.id === data.nextLesson.teacherId
									? data.nextLesson.student.email
									: data.nextLesson.teacher.email}
						</strong>
					</p>
				{:else}
					<p class="empty-state">No upcoming lessons scheduled.</p>
				{/if}
				<a href="/schedule" class="card-link">View Schedule &rarr;</a>
			</div>

			<!-- Unpaid Lessons Card -->
			<div class="card">
				<h2>Outstanding Payments</h2>
				<div class="highlight-info">
					<span class="number">{data.unpaidCount}</span>
				</div>
				<p class="subtitle">Lessons marked as unpaid</p>
				<a href="/schedule" class="card-link">Manage Payments &rarr;</a>
			</div>

			<!-- Quick Actions -->
			<div class="card actions-card">
				<h2>Quick Actions</h2>
				<div class="button-group">
					<a href="/chat" class="action-btn primary">Open Chat</a>
					<a href="/schedule" class="action-btn secondary">Book Lesson</a>
				</div>
			</div>
		</div>
	</div>

{:else}
	<!-- LOGIN VIEW -->
	<div class="login-container">
		<div class="login-card">
			<h1>LK Tutoring</h1>
			<p>Sign in to manage your lessons</p>

			<form on:submit|preventDefault={handleLogin}>
				<input type="email" bind:value={email} placeholder="Email" required />
				<input type="password" bind:value={password} placeholder="Password" required />
				<button type="submit" disabled={loading}>
					{loading ? 'Logging in...' : 'Log In'}
				</button>
			</form>
			{#if message}
				<p class="error">{message}</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Dashboard Styles */
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.welcome-banner h1 {
		margin: 0;
		font-size: 2rem;
		color: #212529;
	}
	.welcome-banner p {
		color: #6c757d;
		margin-top: 0.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
		border: 1px solid #e9ecef;
		display: flex;
		flex-direction: column;
	}

	.card h2 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #495057;
	}

	.highlight-info {
		margin-bottom: 0.5rem;
	}

	.date {
		font-size: 1.5rem;
		font-weight: bold;
		color: #007bff;
		display: block;
	}
	.time {
		font-size: 1.2rem;
		color: #495057;
	}
	.number {
		font-size: 2.5rem;
		font-weight: bold;
		color: #dc3545;
	}

	.subtitle {
		color: #6c757d;
		margin-bottom: 1.5rem;
		flex-grow: 1;
	}

	.card-link {
		text-decoration: none;
		color: #007bff;
		font-weight: 600;
		align-self: flex-start;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		flex-direction: column;
	}

	.action-btn {
		display: block;
		text-align: center;
		padding: 0.75rem;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s;
	}

	.action-btn.primary {
		background-color: #007bff;
		color: white;
	}
	.action-btn.primary:hover { background-color: #0056b3; }

	.action-btn.secondary {
		background-color: #e9ecef;
		color: #495057;
	}
	.action-btn.secondary:hover { background-color: #dee2e6; }


	/* Login Styles */
	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 80vh;
	}

	.login-card {
		background: white;
		padding: 2.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.08);
		width: 100%;
		max-width: 400px;
		text-align: center;
	}

	.login-card h1 { margin: 0 0 0.5rem 0; color: #007bff; }
	.login-card p { color: #6c757d; margin-bottom: 2rem; }

	.login-card form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.login-card input {
		padding: 0.75rem;
		border: 1px solid #ced4da;
		border-radius: 6px;
		font-size: 1rem;
	}

	.login-card button {
		padding: 0.75rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.5rem;
	}
	.login-card button:disabled { background-color: #a0c4ff; }

	.error {
		color: #dc3545;
		margin-top: 1rem;
		font-size: 0.9rem;
	}
</style>