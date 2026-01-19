import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { parseCsv } from './csv';
import { db } from './db';
import { researches } from './schema';
import { extractYear, parseCoordinates, toLocation } from '../utils/research';

const CSV_PATH = 'static/Data Web Hanif - Sheet1.csv';

async function seed() {
	const file = await readFile(CSV_PATH, 'utf-8');
	const rows = parseCsv(file);
	const inserts = rows.map((row) => {
		const title = row.Judul ?? '';
		const coords = row['Koordinat (Lat,Lon)'] ?? '';
		const { lat, lon } = parseCoordinates(coords);
		const searchText = `${title} ${row.Ringkasan ?? ''}`.trim();

		return {
			author: row.Penulis ?? 'Unknown Author',
			title,
			method: row.Metode ?? 'Unknown',
			coordinates: coords || null,
			summary: row.Ringkasan ?? null,
			image: row['Gambar hasil (petunjuk)'] ?? null,
			link: row.Link ?? null,
			lat,
			lon,
			location: searchText ? toLocation(searchText) : null,
			year: extractYear(title)
		};
	});

	await db.delete(researches);
	if (inserts.length) {
		await db.insert(researches).values(inserts);
	}
}

seed()
	.then(() => {
		console.log('Seed completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
