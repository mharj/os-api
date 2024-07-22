/* eslint-disable sort-keys */
import {isIP} from 'net';
import {z} from 'zod';

const hostnameSchema = z.string().regex(/^[a-z.\-0-9]+$/, {message: 'Invalid hostname'});
const aliasSchema = z.string().regex(/^[a-z.\-0-9]+$/, {message: 'Invalid alias'});

export const hostEntrySchema = z.object({
	address: z.string().refine((v) => isIP(v) !== 0, {message: 'Invalid IP address'}),
	hostname: hostnameSchema,
	aliases: z.array(aliasSchema),
	comment: z.string().optional(),
});

export type HostEntry = z.infer<typeof hostEntrySchema>;

export function validateLinuxHostsEntry(entry: HostEntry): void {
	const parsed = hostEntrySchema.safeParse(entry);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		if (issue) {
			throw new TypeError(`Invalid hosts entry: "${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(entry)}`);
		}
		throw new TypeError(`Invalid hosts entry: ${JSON.stringify(entry)}`);
	}
}
