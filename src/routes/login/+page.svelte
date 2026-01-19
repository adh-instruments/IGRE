<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	const pendingMessage = $page.form?.message;
</script>

<svelte:head>
	<title>Login | IGRE</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
	<div class="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-3xl p-8 shadow-xl">
		<div class="space-y-2">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">IGRE Access</p>
			<h1 class="text-2xl font-semibold">Masuk ke Dashboard</h1>
			<p class="text-sm text-slate-400">Masukkan email dan password admin untuk menambah data.</p>
		</div>

		<form method="post" use:enhance class="mt-6 space-y-4">
			<label class="block text-sm">
				<span class="text-slate-300">Email</span>
				<input
					required
					type="email"
					name="email"
					class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
					placeholder="admin@igre.id"
				/>
			</label>

			<label class="block text-sm">
				<span class="text-slate-300">Password</span>
				<input
					required
					type="password"
					name="password"
					class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100"
					placeholder="********"
				/>
			</label>

			{#if pendingMessage}
				<p class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
					{pendingMessage}
				</p>
			{/if}

			<button
				type="submit"
				class="w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
			>
				Masuk
			</button>
		</form>
	</div>
</div>
