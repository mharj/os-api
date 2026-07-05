export const numberCountParser: RegExp = /^(\d+)\s+(.*?)$/; // counter rest of the line

export function parseIndexKey(value: string): [number, string] | undefined {
	const match = value.match(numberCountParser);
	if (match) {
		const numberKey = parseInt(match[1], 10);
		return [numberKey, match[2]];
	}
	return undefined;
}
