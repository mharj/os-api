import {z} from 'zod';

export const serviceEntrySchema = z.object({
	aliases: z.array(z.string().min(1)),
	comment: z.string().optional(),
	port: z.number().min(1),
	protocol: z.string().min(1),
	service: z.string().min(1),
});

export type ServiceEntry = z.infer<typeof serviceEntrySchema>;

export function validateLinuxServicesEntry(entry: ServiceEntry): void {
	const parsed = serviceEntrySchema.safeParse(entry);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		if (issue) {
			throw new TypeError(`Invalid services entry: "${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(entry)}`);
		}
		throw new TypeError(`Invalid services entry: ${JSON.stringify(entry)}`);
	}
}
