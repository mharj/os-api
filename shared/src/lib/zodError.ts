import {z} from 'zod';

export function getErrorStr(parsed: z.SafeParseError<unknown>, rawData: unknown): string {
	const issue = parsed.error.issues[0];
	if (issue) {
		return `"${issue.path.join('.')}" ${issue.message}. ${JSON.stringify(rawData)}`;
	}
	return JSON.stringify(rawData);
}
