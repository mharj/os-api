/* eslint-disable sort-keys */
import {ShadowEntry, shadowEntrySchema} from '../types/v1/shadowEntry';
import {getErrorStr} from './zodError';
import {ILoggerLike} from '@avanio/logger-like';
import {isComment} from './common';

function stringIntOrUndefined(value: string): number | undefined {
	if (value === '') {
		return undefined;
	}
	return parseInt(value, 10);
}

export function parseShadowLine(line: string, logger?: ILoggerLike): ShadowEntry | undefined {
	const input = line.trim();
	if (isComment(input)) {
		return undefined;
	}
	if (input.length === 0) {
		return undefined;
	}
	const [username, password, changed, min, max, warn, inactive, expire, reserved] = input.split(':');
	const rawData = {
		username,
		password,
		changed: changed !== undefined && parseInt(changed, 10),
		min: min !== undefined && parseInt(min, 10),
		max: max !== undefined && parseInt(max, 10),
		warn: warn !== undefined && parseInt(warn, 10),
		inactive: inactive !== undefined && stringIntOrUndefined(inactive),
		expire: expire !== undefined && stringIntOrUndefined(expire),
		reserved: reserved || undefined,
	};
	const status = shadowEntrySchema.safeParse(rawData);
	if (!status.success) {
		logger?.info(`Invalid shadow line: ${getErrorStr(status, rawData)}`);
		return undefined;
	}
	return status.data;
}
