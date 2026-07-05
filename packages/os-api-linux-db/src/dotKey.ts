export type DotKey = `.${string}` | `.${string}/${string}`;

export const dotStringParser: RegExp = /^(\.\S+)\s+(.*?)$/; // .key rest of the line

export function parseDotKey(value: string): [DotKey, string] | undefined {
	const match = value.match(dotStringParser);
	if (match) {
		return [match[1] as DotKey, match[2]];
	}
	return undefined;
}
