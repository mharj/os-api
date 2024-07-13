import {z} from 'zod';

export const servicesEntrySchema = z.object({
	aliases: z.array(z.string().min(1)),
	comment: z.string().optional(),
	port: z.number().min(1),
	protocol: z.string().min(1),
	service: z.string().min(1),
});

export type ServicesEntry = z.infer<typeof servicesEntrySchema>;

export function validateLinuxServicesEntry(entry: ServicesEntry): void {
	const parsed = servicesEntrySchema.safeParse(entry);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		if (issue) {
			throw new TypeError(`Invalid services entry: "${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(entry)}`);
		}
		throw new TypeError(`Invalid services entry: ${JSON.stringify(entry)}`);
	}
}
