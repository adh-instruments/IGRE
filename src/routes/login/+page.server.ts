import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { verifyUser } from '$lib/server/user';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') || '').trim();
		const password = String(formData.get('password') || '').trim();

		if (!email || !password) {
			return fail(400, { message: 'Email dan password wajib diisi.' });
		}

		const user = await verifyUser(email, password);
		if (!user) {
			return fail(400, { message: 'Email atau password salah.' });
		}

		const session = await auth.createSession(user.id, {});
		const sessionCookie = auth.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(303, '/admin');
	}
};
