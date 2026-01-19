import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { researches } from '$lib/server/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const rows = await db.select().from(researches).orderBy(desc(researches.createdAt));
	return { rows };
};
