import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (locals.session) {
		await auth.invalidateSession(locals.session.id);
	}
	const sessionCookie = auth.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});

	throw redirect(303, '/');
};
