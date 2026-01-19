<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	
	export let data: PageData;

	const mapTiles = {
		hybrid: {
			label: 'Hybrid Satellite',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			attribution: 'Tiles &copy; Esri'
		},
		labels: {
			label: 'Reference Labels',
			url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
			attribution: 'Labels &copy; Esri'
		},
		osm: {
			label: 'OpenStreetMap',
			url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			attribution: '&copy; OSM contributors'
		},
		dark: {
			label: 'Dark Mode',
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			attribution: '&copy; CARTO'
		}
	};

	const rows = data.rows.map((row) => ({
		...row,
		coordinates: row.coordinates ?? '',
		image: row.image ?? '',
		link: row.link ?? '',
		summary: row.summary ?? '',
		location: row.location ?? '',
		year: row.year ?? ''
	}));

	const totalCount = rows.length;
	const visibleCount = () => visibleRows().length;
	const PAGE_SIZE = 10;
	let currentPage = 1;

	let mapContainer: HTMLDivElement;
	let mapRef: any;
	let heatLayer: any;
	let imageLayer: any;
	let tableWrapper: HTMLDivElement;
	let infoPanel: HTMLDivElement;
	let topRow: HTMLDivElement;
	let mapPane: HTMLDivElement;
	let infoPane: HTMLDivElement;
	let resizerV: HTMLDivElement;
	let resizerH: HTMLDivElement;

	let keyword = '';
	let methodFilter = '';
	let yearFilter = '';
	let locationFilter = '';
	let activeRowId = '';
	let mobileMenuOpen = false;

	const methods = Array.from(new Set(rows.map((row) => row.method).filter(Boolean))).sort();
	const years = Array.from(new Set(rows.map((row) => row.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
	const locations = Array.from(new Set(rows.map((row) => row.location).filter(Boolean))).sort();

	const visibleRows = () =>
		rows.filter((row) => {
			const keywordMatch =
				!keyword || `${row.title} ${row.summary}`.toLowerCase().includes(keyword.toLowerCase());
			const methodMatch = !methodFilter || row.method === methodFilter;
			const yearMatch = !yearFilter || row.year === yearFilter;
			const locationMatch = !locationFilter || row.location === locationFilter;
			return keywordMatch && methodMatch && yearMatch && locationMatch;
		});

	const tableRows = () => {
		const visible = visibleRows();
		const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
		if (currentPage > totalPages) currentPage = totalPages;
		const start = (currentPage - 1) * PAGE_SIZE;
		return visible.slice(start, start + PAGE_SIZE);
	};

	const pageCount = () => Math.max(1, Math.ceil(visibleRows().length / PAGE_SIZE));

	const updatePanel = (row: typeof rows[number] | null) => {
		if (!infoPanel) return;
		if (!row) {
			infoPanel.innerHTML = `
				<div class="text-center text-slate-500 flex flex-col items-center justify-center h-full">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
					</svg>
					<h2 class="text-lg font-semibold">Select a data point</h2>
					<p>Click a marker or table row to view details.</p>
				</div>
			`;
			return;
		}

		const imagePath = row.image ? `/assets/images/${row.image}` : '';
		const imageHTML = row.image
			? `<img src="${imagePath}" alt="Research result image" class="w-full h-auto rounded-lg shadow-md mt-1" onerror="this.onerror=null;this.src='https://placehold.co/600x400/EEE/31343C?text=Image+Not+Found';">`
			: '<p class="text-sm text-slate-500 text-center italic mt-1">No image provided</p>';
		const linkHTML = row.link
			? `<a href="${row.link}" target="_blank" class="text-cyan-600 hover:underline break-all">View PDF</a>`
			: '<span>No PDF provided</span>';

		infoPanel.innerHTML = `
			<div class="space-y-4">
				<div>
					<h2 class="text-xl font-bold text-slate-900">${row.title || 'No Title'}</h2>
					<p class="text-sm text-slate-500 mt-1">By ${row.author || 'Unknown Author'}</p>
				</div>
				<div class="border-t border-slate-200 pt-4">
					<dl class="space-y-4">
						<div>
							<dt class="text-sm font-medium text-slate-500">Result Image</dt>
							<dd class="mt-1">${imageHTML}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-slate-500">Method</dt>
							<dd class="mt-1 text-md text-slate-800">${row.method || 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-slate-500">Coordinates</dt>
							<dd class="mt-1 text-md text-slate-800">${row.coordinates || 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-slate-500">Summary</dt>
							<dd class="mt-1 text-md text-slate-800 text-justify">${row.summary || 'No summary available.'}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-slate-500">Source Document</dt>
							<dd class="mt-1 text-md">${linkHTML}</dd>
						</div>
					</dl>
				</div>
			</div>
		`;
	};

	const updateMapLayers = () => {
		if (!mapRef) return;
		imageLayer.clearLayers();
		const heatPoints: [number, number, number][] = [];
		const visible = visibleRows();
		if (currentPage > pageCount()) currentPage = pageCount();
		visible.forEach((row) => {
			if (!row.lat || !row.lon) return;
			const lat = Number(row.lat);
			const lon = Number(row.lon);
			if (Number.isNaN(lat) || Number.isNaN(lon)) return;
			heatPoints.push([lat, lon, 1]);
			const icon = (window as any).L.icon({
				iconUrl: row.image ? `/assets/images/${row.image}` : 'https://placehold.co/60x40/EEE/31343C?text=?',
				iconSize: [60, 40],
				iconAnchor: [30, 20],
				className: 'rounded-md shadow-lg border-2 border-white'
			});
			const marker = (window as any).L.marker([lat, lon], { icon });
			marker.on('click', () => {
				activeRowId = row.id;
				updatePanel(row);
			});
			imageLayer.addLayer(marker);
		});
		heatLayer.setLatLngs(heatPoints);

		if (visible.length) {
			const latLngs = heatPoints.map(([lat, lon]) => (window as any).L.latLng(lat, lon));
			if (latLngs.length) {
				mapRef.fitBounds((window as any).L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 15 });
			}
		}
	};

	const initMap = async () => {
		if (!mapContainer) return;
		await import('leaflet');
		await import('leaflet.heat');
		const L = (window as any).L;
		mapRef = L.map(mapContainer, { center: [-2.5489, 118.0149], zoom: 5 });

		const satellite = L.tileLayer(mapTiles.hybrid.url, { attribution: mapTiles.hybrid.attribution });
		const labels = L.tileLayer(mapTiles.labels.url, { attribution: mapTiles.labels.attribution });
		const hybrid = L.layerGroup([satellite, labels]).addTo(mapRef);
		const baseMaps = {
			[mapTiles.hybrid.label]: hybrid,
			[mapTiles.osm.label]: L.tileLayer(mapTiles.osm.url, { attribution: mapTiles.osm.attribution }),
			[mapTiles.dark.label]: L.tileLayer(mapTiles.dark.url, { attribution: mapTiles.dark.attribution })
		};
		imageLayer = L.layerGroup().addTo(mapRef);
		heatLayer = L.heatLayer([], {
			radius: 25,
			gradient: { 0.4: '#fdba74', 0.7: '#f97316', 0.9: '#9a3412', 1.0: '#451a03' }
		}).addTo(mapRef);
		L.control.layers(baseMaps, { Heatmap: heatLayer, 'Image Markers': imageLayer }).addTo(mapRef);
		updateMapLayers();
	};

	const setupResize = () => {
		if (!topRow || !tableWrapper || !mapPane || !infoPane || !resizerV || !resizerH) return;
		const updateVertical = (clientY: number) => {
			const containerHeight = topRow.parentElement?.clientHeight || 0;
			let newTopHeight = clientY - topRow.getBoundingClientRect().top;
			if (newTopHeight < 200) newTopHeight = 200;
			if (newTopHeight > containerHeight - 200) newTopHeight = containerHeight - 200;
			topRow.style.height = `${newTopHeight}px`;
			const remaining = containerHeight - newTopHeight - resizerV.offsetHeight;
			tableWrapper.style.height = `${remaining}px`;
			mapRef?.invalidateSize();
		};

		const updateHorizontal = (clientX: number) => {
			const containerWidth = topRow.clientWidth;
			let newMapWidth = clientX - topRow.getBoundingClientRect().left;
			if (newMapWidth < 220) newMapWidth = 220;
			if (newMapWidth > containerWidth - 220) newMapWidth = containerWidth - 220;
			mapPane.style.width = `${newMapWidth}px`;
			infoPane.style.width = `${containerWidth - newMapWidth - resizerH.offsetWidth}px`;
			mapRef?.invalidateSize();
		};

		resizerV.addEventListener('mousedown', (event) => {
			event.preventDefault();
			document.body.style.cursor = 'row-resize';
			const handler = (moveEvent: MouseEvent) => updateVertical(moveEvent.clientY);
			const stop = () => {
				document.body.style.cursor = 'default';
				window.removeEventListener('mousemove', handler);
				window.removeEventListener('mouseup', stop);
			};
			window.addEventListener('mousemove', handler);
			window.addEventListener('mouseup', stop);
		});

		resizerH.addEventListener('mousedown', (event) => {
			event.preventDefault();
			document.body.style.cursor = 'col-resize';
			const handler = (moveEvent: MouseEvent) => updateHorizontal(moveEvent.clientX);
			const stop = () => {
				document.body.style.cursor = 'default';
				window.removeEventListener('mousemove', handler);
				window.removeEventListener('mouseup', stop);
			};
			window.addEventListener('mousemove', handler);
			window.addEventListener('mouseup', stop);
		});

		updateVertical(topRow.getBoundingClientRect().top + topRow.clientHeight);
	};

	const applyFilters = () => {
		activeRowId = '';
		currentPage = 1;
		updatePanel(null);
		updateMapLayers();
	};

	const clearFilters = () => {
		keyword = '';
		methodFilter = '';
		yearFilter = '';
		locationFilter = '';
		applyFilters();
		mobileMenuOpen = false;
	};

	const handleRowClick = (row: typeof rows[number]) => {
		activeRowId = row.id;
		updatePanel(row);
		const lat = Number(row.lat);
		const lon = Number(row.lon);
		if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
			mapRef?.setView([lat, lon], 15);
		}
		mobileMenuOpen = false;
	};

	const goToPage = (page: number) => {
		currentPage = Math.min(Math.max(page, 1), pageCount());
		activeRowId = '';
		updatePanel(null);
		updateMapLayers();
	};

	onMount(() => {
		updatePanel(null);
		initMap();
		setupResize();
	});
</script>

<svelte:head>
	<title>Indonesian Geophysical Research Explorer</title>
	<link
		rel="stylesheet"
		href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
		integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
		crossorigin=""
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-slate-100 text-slate-700 flex flex-col">
	<header class="bg-[#007ac2] shadow-md z-20 flex-shrink-0">
		<div class="max-w-full mx-auto py-3 px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<a href="/" class="text-white no-underline flex-shrink-0">
					<h1 class="text-lg sm:text-xl font-bold whitespace-nowrap text-ellipsis">
						Indonesian Geophysical Research Explorer
					</h1>
					<p class="text-xs text-blue-100/80 hidden sm:block">
						Showing {visibleCount()} of {totalCount} studies
					</p>
				</a>
				<div class="hidden md:flex items-center gap-2 flex-grow justify-end">
					<select
						bind:value={methodFilter}
						on:change={applyFilters}
						class="p-2 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200 w-32"
					>
						<option value="">Method</option>
						{#each methods as method}
							<option value={method}>{method}</option>
						{/each}
					</select>
					<select
						bind:value={yearFilter}
						on:change={applyFilters}
						class="p-2 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200 w-24"
					>
						<option value="">Year</option>
						{#each years as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
					<select
						bind:value={locationFilter}
						on:change={applyFilters}
						class="p-2 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200 w-32"
					>
						<option value="">Location</option>
						{#each locations as location}
							<option value={location}>{location}</option>
						{/each}
					</select>
					<button
						on:click|preventDefault={clearFilters}
						class="p-2 bg-white text-slate-700 rounded-md hover:bg-slate-200 text-sm transition-colors duration-200"
					>
						Clear
					</button>
					<a
						href="/login"
						class="p-2 border border-blue-200 text-white rounded-md hover:bg-blue-800/40 text-sm transition-colors duration-200"
					>
						Admin
					</a>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
							<svg
								class="w-5 h-5 text-slate-400"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</div>
						<input
							bind:value={keyword}
							on:keyup={applyFilters}
							type="text"
							placeholder="Search..."
							class="p-2 pl-10 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200 w-48"
						/>
					</div>
				</div>
				<div class="md:hidden">
					<button
						on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="p-2 rounded-md text-white hover:bg-blue-800 focus:outline-none"
					>
						<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>
			</div>

			{#if mobileMenuOpen}
				<div class="md:hidden pt-4">
					<div class="flex flex-col gap-3">
						<div class="relative">
							<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								<svg
									class="w-5 h-5 text-slate-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
							<input
								bind:value={keyword}
								on:keyup={applyFilters}
								placeholder="Search..."
								class="w-full p-2 pl-10 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200"
							/>
						</div>
						<select
							bind:value={methodFilter}
							on:change={applyFilters}
							class="w-full p-2 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200"
						>
							<option value="">Method</option>
							{#each methods as method}
								<option value={method}>{method}</option>
							{/each}
						</select>
						<select
							bind:value={yearFilter}
							on:change={applyFilters}
							class="w-full p-2 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200"
						>
							<option value="">Year</option>
							{#each years as year}
								<option value={year}>{year}</option>
							{/each}
						</select>
						<select
							bind:value={locationFilter}
							on:change={applyFilters}
							class="w-full p-2 border rounded-md bg-white text-sm text-slate-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-200"
						>
							<option value="">Location</option>
							{#each locations as location}
								<option value={location}>{location}</option>
							{/each}
						</select>
						<button
							on:click|preventDefault={clearFilters}
							class="w-full bg-white text-slate-700 p-2 rounded-md hover:bg-slate-200 text-sm transition-colors duration-200"
						>
							Clear
						</button>
						<a
							href="/login"
							class="w-full border border-blue-200 text-white p-2 rounded-md text-sm text-center hover:bg-blue-800/40 transition-colors duration-200"
						>
							Admin
						</a>
					</div>
				</div>
			{/if}
		</div>
	</header>

	<div class="flex flex-col flex-1" id="main-container">
		<div class="flex flex-col md:flex-row overflow-hidden" bind:this={topRow}>
			<div class="w-full h-1/2 md:w-2/3 md:h-full flex-shrink-0" bind:this={mapPane}>
				<div class="h-full w-full" bind:this={mapContainer}></div>
			</div>
			<div class="resizer-h hidden md:block" bind:this={resizerH}></div>
			<div
				class="w-full h-1/2 md:w-1/3 md:h-auto bg-white p-6 overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200"
				bind:this={infoPane}
			>
				<div class="h-full" bind:this={infoPanel}></div>
			</div>
		</div>

		<div class="resizer-v" bind:this={resizerV}></div>

		<div class="border-t-2 border-slate-200" bind:this={tableWrapper}>
			<div class="flex-grow overflow-auto p-4">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-3 text-xs text-slate-500">
					<p>Page {currentPage} of {pageCount()}</p>
					<p>Total {visibleCount()} studies</p>
				</div>
				<table class="w-full text-sm" id="data-table">
					<thead class="text-slate-500 uppercase text-xs">
						<tr>
							<th class="text-left pb-2">Title</th>
							<th class="text-left pb-2">Author</th>
							<th class="text-left pb-2">Method</th>
						</tr>
					</thead>
					<tbody>
						{#each tableRows() as row}
							<tr
								class={`cursor-pointer border-t border-slate-200 hover:bg-slate-100 ${
									activeRowId === row.id ? 'bg-slate-100' : ''
								}`}
								on:click={() => handleRowClick(row)}
							>
								<td class="py-2 pr-3">{row.title}</td>
								<td class="py-2 pr-3">{row.author}</td>
								<td class="py-2">{row.method}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="flex flex-wrap items-center justify-between gap-2 pt-4">
					<div class="flex items-center gap-2 text-xs text-slate-500">
						<span>Rows per page:</span>
						<span class="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{PAGE_SIZE}</span>
					</div>
					<div class="flex items-center gap-2">
						<button
							on:click={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
						>
							Previous
						</button>
						<button
							on:click={() => goToPage(currentPage + 1)}
							disabled={currentPage === pageCount()}
							class="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	html,
	body {
		height: 100%;
		margin: 0;
		padding: 0;
		background-color: #f8f8f8;
		overflow: hidden;
		font-family: 'Roboto', sans-serif;
	}

	#main-container {
		min-height: 0;
	}

	.resizer-v {
		background-color: #e5e7eb;
		cursor: row-resize;
		height: 8px;
		flex-shrink: 0;
	}

	.resizer-h {
		background-color: #e5e7eb;
		cursor: col-resize;
		width: 8px;
		flex-shrink: 0;
	}

	.resizer-v:hover,
	.resizer-h:hover {
		background-color: #007ac2;
	}
</style>
