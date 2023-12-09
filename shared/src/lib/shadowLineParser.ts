/* eslint-disable sort-keys */
import {ShadowEntry, shadowEntrySchema} from '../types/v1/shadowEntry';
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
	const status = shadowEntrySchema.safeParse({
		username,
		password,
		changed: parseInt(changed, 10),
		min: parseInt(min, 10),
		max: parseInt(max, 10),
		warn: parseInt(warn, 10),
		inactive: stringIntOrUndefined(inactive),
		expire: stringIntOrUndefined(expire),
		reserved: reserved || undefined,
	});
	if (!status.success) {
		logger?.info(`Invalid shadow line: ${line}`);
		return undefined;
	}
	return status.data;
}
