<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	const message = $page.form?.message;
	const success = $page.form?.success;

	let mode: 'create' | 'edit' = 'create';
	let activeId = '';

	let title = '';
	let author = '';
	let method = '';
	let coordinates = '';
	let summary = '';
	let image = '';
	let link = '';

	const resetForm = () => {
		mode = 'create';
		activeId = '';
		title = '';
		author = '';
		method = '';
		coordinates = '';
		summary = '';
		image = '';
		link = '';
	};

	const editRow = (row: (typeof data.rows)[number]) => {
		mode = 'edit';
		activeId = row.id;
		title = row.title;
		author = row.author;
		method = row.method;
		coordinates = row.coordinates ?? '';
		summary = row.summary ?? '';
		image = row.image ?? '';
		link = row.link ?? '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
</script>

<svelte:head>
	<title>Admin | IGRE</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
	<div class="max-w-5xl mx-auto space-y-6">
		<header class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Admin Panel</p>
				<h1 class="text-2xl font-semibold">Kelola Data Penelitian</h1>
				<p class="text-sm text-slate-400">Tambah, ubah, dan hapus data riset.</p>
			</div>
			<form method="post" action="/logout">
				<button class="rounded-full border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Keluar</button>
			</form>
		</header>

		{#if message}
			<p class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
				{message}
			</p>
		{:else if success}
			<p class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
				Perubahan tersimpan.
			</p>
		{/if}

		<form method="post" use:enhance action={mode === 'create' ? '?/create' : '?/update'} class="space-y-4">
			<input type="hidden" name="id" value={activeId} />
			<div class="grid gap-4 md:grid-cols-2">
				<label class="text-sm">
					<span class="text-slate-300">Judul</span>
					<input
						name="title"
						required
						bind:value={title}
						class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
						placeholder="Judul penelitian"
					/>
				</label>
				<label class="text-sm">
					<span class="text-slate-300">Penulis</span>
					<input
						name="author"
						required
						bind:value={author}
						class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
						placeholder="Nama penulis"
					/>
				</label>
				<label class="text-sm">
					<span class="text-slate-300">Metode</span>
					<input
						name="method"
						required
						bind:value={method}
						class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
						placeholder="Metode penelitian"
					/>
				</label>
				<label class="text-sm">
					<span class="text-slate-300">Koordinat</span>
					<input
						name="coordinates"
						bind:value={coordinates}
						class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
						placeholder="-5.4, 105.2"
					/>
				</label>
				<label class="text-sm">
					<span class="text-slate-300">Gambar (nama file)</span>
					<input
						name="image"
						bind:value={image}
						class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
						placeholder="example.png"
					/>
				</label>
				<label class="text-sm">
					<span class="text-slate-300">Link PDF</span>
					<input
						name="link"
						bind:value={link}
						class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
						placeholder="https://..."
					/>
				</label>
			</div>
			<label class="text-sm">
				<span class="text-slate-300">Ringkasan</span>
				<textarea
					name="summary"
					rows="5"
					bind:value={summary}
					class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm"
					placeholder="Ringkasan singkat penelitian"
				></textarea>
			</label>
			<div class="grid gap-3 sm:grid-cols-2">
				<button class="w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
					{mode === 'create' ? 'Simpan Data' : 'Simpan Perubahan'}
				</button>
				<button
					type="button"
					on:click={resetForm}
					class="w-full rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
				>
					Reset Form
				</button>
			</div>
		</form>

		<section class="space-y-3">
			<h2 class="text-lg font-semibold">Daftar Penelitian</h2>
			<div class="overflow-x-auto rounded-2xl border border-slate-800">
				<table class="w-full text-sm">
					<thead class="bg-slate-900 text-slate-400">
						<tr>
							<th class="px-4 py-3 text-left">Judul</th>
							<th class="px-4 py-3 text-left">Penulis</th>
							<th class="px-4 py-3 text-left">Metode</th>
							<th class="px-4 py-3 text-left">Koordinat</th>
							<th class="px-4 py-3 text-right">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each data.rows as row}
							<tr class="border-t border-slate-800">
								<td class="px-4 py-3">{row.title}</td>
								<td class="px-4 py-3">{row.author}</td>
								<td class="px-4 py-3">{row.method}</td>
								<td class="px-4 py-3">{row.coordinates ?? '-'}</td>
								<td class="px-4 py-3">
									<div class="flex justify-end gap-2">
										<button
											type="button"
											on:click={() => editRow(row)}
											class="rounded-full border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800"
										>
											Edit
										</button>
										<form method="post" action="?/delete" use:enhance>
											<input type="hidden" name="id" value={row.id} />
											<button
												class="rounded-full border border-rose-500/40 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/10"
											>
												Hapus
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</div>
</div>
