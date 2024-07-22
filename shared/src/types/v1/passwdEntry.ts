/* eslint-disable sort-keys */
import {z} from 'zod';

export const passwdEntrySchema = z.object({
	username: z
		.string()
		.min(1, 'must be at least 1 character')
		.max(31, 'must be at most 31 characters')
		.regex(/^[a-z_][a-z0-9_-]*[$]?$/, 'contains invalid characters'),
	password: z.string(),
	uid: z.number(),
	gid: z.number(),
	gecos: z.string(),
	home: z.string(),
	shell: z.string(),
});

export type PasswordEntry = z.infer<typeof passwdEntrySchema>;

export function validateLinuxPasswordEntry(entry: PasswordEntry): void {
	const parsed = passwdEntrySchema.safeParse(entry);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		if (issue) {
			throw new TypeError(`Invalid passwd entry: "${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(entry)}`);
		}
		throw new TypeError(`Invalid passwd entry: ${JSON.stringify(entry)}`);
	}
}
