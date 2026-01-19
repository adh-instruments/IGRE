export function extractYear(title: string) {
	const match = title.match(/\((\d{4})\)/);
	return match ? match[1] : null;
}

export function toLocation(text: string) {
	const lower = text.toLowerCase();
	if (lower.includes('bandar lampung')) return 'Bandar Lampung';
	if (lower.includes('pesawaran')) return 'Pesawaran';
	if (lower.includes('jati agung') || lower.includes('jatimulyo')) return 'Jati Agung';
	if (lower.includes('way umpu')) return 'Way Umpu';
	if (lower.includes('itera')) return 'ITERA';
	return null;
}

export function parseCoordinates(raw: string | null) {
	if (!raw) return { lat: null, lon: null };
	const [lat, lon] = raw.split(',').map((value) => value.trim());
	return {
		lat: lat || null,
		lon: lon || null
	};
}
