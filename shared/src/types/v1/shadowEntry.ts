/* eslint-disable sort-keys */
import {z} from 'zod';

export const shadowEntrySchema = z.object({
	username: z
		.string()
		.min(1)
		.max(31)
		.regex(/^[a-z_][a-z0-9_-]*[$]?$/),
	password: z.string(),
	changed: z.number(),
	min: z.number(),
	max: z.number(),
	warn: z.number(),
	inactive: z.number().optional(),
	expire: z.number().optional(),
	reserved: z.string().optional(),
});

export type ShadowEntry = z.infer<typeof shadowEntrySchema>;

/**
 * Linux shadow file entry
 */
export type ShadowFileEntry = ShadowEntry & {
	readonly line: number;
};

export function validateLinuxShadowEntry(entry: ShadowEntry): void {
	const parsed = shadowEntrySchema.safeParse(entry);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		if (issue) {
			throw new TypeError(`Invalid shadow entry: "${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(entry)}}`);
		}
		throw new TypeError(`Invalid shadow entry: ${JSON.stringify(entry)}`);
	}
}
