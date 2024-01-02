import {z} from 'zod';

export const nssStatuses = ['SUCCESS', 'NOTFOUND', 'UNAVAIL', 'TRYAGAIN', '!SUCCESS', '!NOTFOUND', '!UNAVAIL', '!TRYAGAIN'] as const;
export const nssActions = ['return', 'continue', 'merge'] as const;

export const nssDatabases = [
	'aliases',
	'ethers',
	'group',
	'hosts',
	'initgroups',
	'netgroup',
	'networks',
	'passwd',
	'protocols',
	'publickey',
	'rpc',
	'services',
	'shadow',
] as const;

export const nssEntryProviderActionSchema = z.object({
	status: z.enum(nssStatuses),
	action: z.enum(nssActions),
});

export type NssEntryProviderAction = z.infer<typeof nssEntryProviderActionSchema>;

export const nssEntryProviderSchema = z.object({
	provider: z.string(),
	action: nssEntryProviderActionSchema.optional(),
});

export type NssEntryProvider = z.infer<typeof nssEntryProviderSchema>;

export const nssEntrySchema = z.object({
	database: z.enum(nssDatabases),
	providers: z.array(nssEntryProviderSchema).min(1),
});

export type NssEntry = z.infer<typeof nssEntrySchema>;

export type NssFileEntry = NssEntry & {
	readonly line: number;
};

export function validateLinuxNssEntry(entry: NssEntry): void {
	const parsed = nssEntrySchema.safeParse(entry);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		if (issue) {
			throw new TypeError(`Invalid nss entry: "${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(entry)}`);
		}
		throw new TypeError(`Invalid nss entry: ${JSON.stringify(entry)}`);
	}
}
