import {type HostEntry, hostEntrySchema} from '../types/v1/hostEntry';
import {normalizeLine, splitCommentString} from './common';
import {getErrorStr} from './zodError';
import type {ILoggerLike} from '@avanio/logger-like';

/**
 * parse raw host line into HostEntry object with optional logger for error reporting
 */
export function parseHostLine(line: string, logger?: ILoggerLike): HostEntry | undefined {
	const input = normalizeLine(line);
	if (!input) {
		return undefined;
	}
	const [entry, comment] = splitCommentString(input);
	if (!entry) {
		return undefined;
	}
	const parts = entry.split(' ');
	const address = parts.shift();
	const hostname = parts.shift();
	const aliases = parts;
	const rawData = {address, aliases, comment, hostname};
	const status = hostEntrySchema.safeParse(rawData);
	if (!status.success) {
		logger?.info(`Invalid hosts line: ${getErrorStr(status, rawData)}`);
		return undefined;
	}
	return status.data;
}
