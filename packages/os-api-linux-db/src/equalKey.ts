export type EqualKey = `=${number}` | `=${number}/${string}` | `=${string}` | `=${string}/${string}`;

export const equalStringParser: RegExp = /^(=\S+)\s+(.*?)$/; // =key rest of the line

export function parseEqualKey(value: string): [EqualKey, string] | undefined {
	const match = value.match(equalStringParser);
	if (match) {
		return [match[1] as EqualKey, match[2]];
	}
	return undefined;
}
