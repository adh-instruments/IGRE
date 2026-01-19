import 'dotenv/config';
import { db } from './db';
import { users } from './schema';
import { createUser } from './user';
import { eq } from 'drizzle-orm';

const args = process.argv.slice(2);

function getArg(flag: string) {
	const index = args.indexOf(flag);
	if (index === -1) return null;
	return args[index + 1] ?? null;
}

async function run() {
	const email = getArg('--email');
	const password = getArg('--password');

	if (!email || !password) {
		console.error('Usage: bun run db:create-admin --email you@example.com --password yourpassword');
		process.exit(1);
	}

	const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
	if (existing) {
		console.error('User already exists.');
		process.exit(1);
	}

	await createUser(email, password, true);
	console.log('Admin user created.');
}

run().catch((error) => {
	console.error(error);
	process.exit(1);
});
