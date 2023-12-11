import {z} from 'zod';

export const passwdEntrySchema = z.object({
	username: z
		.string()
		.min(1)
		.max(31)
		.regex(/^[a-z_][a-z0-9_-]*[$]?$/),
	password: z.string(),
	uid: z.number(),
	gid: z.number(),
	gecos: z.string(),
	home: z.string(),
	shell: z.string(),
});

export type PasswordEntry = z.infer<typeof passwdEntrySchema>;

/**
 * Linux password file entry
 */
export type PasswordFileEntry = PasswordEntry & {
	readonly line: number;
};
