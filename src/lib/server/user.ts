import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './schema';
import { hashPassword, verifyPassword } from './password';

export async function createUser(email: string, password: string, isAdmin = false) {
	const passwordHash = await hashPassword(password);
	const [user] = await db
		.insert(users)
		.values({
			email,
			passwordHash,
			isAdmin
		})
		.returning();

	if (!user) {
		throw new Error('Failed to create user');
	}

	return user;
}

export async function verifyUser(email: string, password: string) {
	const user = await db.query.users.findFirst({ where: eq(users.email, email) });
	if (!user) return null;
	const valid = await verifyPassword(user.passwordHash, password);
	if (!valid) return null;
	return user;
}
