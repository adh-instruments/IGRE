import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { researches } from '$lib/server/schema';
import { extractYear, parseCoordinates, toLocation } from '$lib/utils/research';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.user.isAdmin) {
		throw redirect(303, '/login');
	}

	const rows = await db.select().from(researches).orderBy(desc(researches.createdAt));

	return {
		user: locals.user,
		rows
	};
};

function parseFormValue(value: FormDataEntryValue | null) {
	return String(value || '').trim();
}

function buildResearchPayload(formData: FormData) {
	const title = parseFormValue(formData.get('title'));
	const author = parseFormValue(formData.get('author'));
	const method = parseFormValue(formData.get('method'));
	const coordinates = parseFormValue(formData.get('coordinates'));
	const summary = parseFormValue(formData.get('summary'));
	const image = parseFormValue(formData.get('image'));
	const link = parseFormValue(formData.get('link'));

	const { lat, lon } = parseCoordinates(coordinates);
	const location = toLocation(`${title} ${summary}`.trim());
	const year = extractYear(title);

	return {
		title,
		author,
		method,
		coordinates: coordinates || null,
		summary: summary || null,
		image: image || null,
		link: link || null,
		lat,
		lon,
		location,
		year
	};
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const payload = buildResearchPayload(formData);

		if (!payload.title || !payload.author || !payload.method) {
			return fail(400, { message: 'Judul, penulis, dan metode wajib diisi.' });
		}

		await db.insert(researches).values(payload);

		return { success: true };
	},
	update: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const id = parseFormValue(formData.get('id'));

		if (!id) {
			return fail(400, { message: 'ID data tidak ditemukan.' });
		}

		const payload = buildResearchPayload(formData);
		if (!payload.title || !payload.author || !payload.method) {
			return fail(400, { message: 'Judul, penulis, dan metode wajib diisi.' });
		}

		await db.update(researches).set(payload).where(eq(researches.id, id));

		return { success: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.user || !locals.user.isAdmin) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const id = parseFormValue(formData.get('id'));

		if (!id) {
			return fail(400, { message: 'ID data tidak ditemukan.' });
		}

		await db.delete(researches).where(eq(researches.id, id));

		return { success: true };
	}
};
