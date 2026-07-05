/**
 * pre-validate line before parsing
 * - length > 0
 * - not start with #
 */
export function isValidLine(line: string): boolean {
	const target = line.trim();
	return target.length > 0 && !target.startsWith('#');
}

export function splitCommentString(value: string): [string, string | undefined] {
	const idx = value.indexOf('#');
	if (idx === -1) {
		return [value, undefined];
	}
	return [
		value.slice(0, idx).trim(),
		value
			.slice(idx + 1)
			.replace('#', '')
			.trim(),
	];
}

/**
 * Normalize line by removing tabs and multiple spaces
 * - if line is invalid, return undefined
 */
export function normalizeLine(line: string): string | undefined {
	if (!isValidLine(line)) {
		return undefined;
	}
	return line.replace(/\t/, ' ').replace(/\s+/g, ' ').trim();
}
