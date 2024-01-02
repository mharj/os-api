import {HostEntry, hostEntrySchema} from '../types/v1/hostEntry';
import {getErrorStr} from './zodError';
import type {ILoggerLike} from '@avanio/logger-like';
import {isComment} from './common';

function splitString(value: string): [string, string | undefined] {
	const idx = value.indexOf('#');
	if (idx === -1) {
		return [value, undefined];
	}
	return [value.slice(0, idx), value.slice(idx + 1)];
}

/**
 * pre-validate line before parsing
 */
export function isValidLine(line: string): boolean {
	return line.trim().length > 0 && !line.startsWith('#');
}

/**
 * parse raw host line into HostEntry object with optional logger for error reporting
 */
export function parseHostLine(line: string, logger?: ILoggerLike): HostEntry | undefined {
	const input = line.trim();
	if (isComment(input)) {
		return undefined;
	}
	if (input.length === 0) {
		return undefined;
	}
	let [entry, comment] = splitString(input);
	if (!entry) {
		return undefined;
	}
	entry = entry.replace(/\s+/g, ' ').trim();
	comment = comment ? comment.replace(/#/, '').trim() : undefined;
	const parts = entry.split(/\s+/);
	const address = parts.shift();
	const hostname = parts.shift();
	const aliases = parts || [];
	const rawData = {address, aliases, comment, hostname};
	const status = hostEntrySchema.safeParse(rawData);
	if (!status.success) {
		logger?.info(`Invalid hosts line: ${getErrorStr(status, rawData)}`);
		return undefined;
	}
	return status.data;
}
