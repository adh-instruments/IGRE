export function parseCsv(text: string) {
	const lines = text.trim().split(/\r?\n/);
	if (!lines.length) return [];

	const headers = lines[0]
		.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
		.map((header) => header.trim().replace(/^"|"$/g, ''));

	return lines.slice(1).map((line) => {
		const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
		return headers.reduce<Record<string, string>>((acc, header, index) => {
			acc[header] = (values[index] || '')
				.trim()
				.replace(/^"|"$/g, '')
				.replace(/""/g, '"');
			return acc;
		}, {});
	});
}
