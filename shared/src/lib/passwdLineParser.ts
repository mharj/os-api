/* eslint-disable sort-keys */
import {passwdEntrySchema, type PasswordEntry} from '../types/v1/passwdEntry';
import {getErrorStr} from './zodError';
import {type ILoggerLike} from '@avanio/logger-like';
import {normalizeLine} from './common';

export function parsePasswdLine(line: string, logger?: ILoggerLike): PasswordEntry | undefined {
	const input = normalizeLine(line);
	if (!input) {
		return undefined;
	}
	const [username, password, uid, gid, gecos, home, shell] = input.split(':');
	const rawData = {
		username,
		password,
		uid: uid !== undefined && parseInt(uid, 10),
		gid: gid !== undefined && parseInt(gid, 10),
		gecos,
		home,
		shell,
	};
	const status = passwdEntrySchema.safeParse(rawData);
	if (!status.success) {
		logger?.info(`Invalid passwd line: ${getErrorStr(status, rawData)}`);
		return undefined;
	}
	return status.data;
}
