/* eslint-disable sort-keys */
import {passwdEntrySchema, PasswordEntry} from '../types/v1/passwdEntry';
import {ILoggerLike} from '@avanio/logger-like';
import {isComment} from './common';

export function parsePasswdLine(line: string, logger?: ILoggerLike): PasswordEntry | undefined {
	const input = line.trim();
	if (isComment(input)) {
		return undefined;
	}
	if (input.length === 0) {
		return undefined;
	}
	const [username, password, uid, gid, gecos, home, shell] = input.split(':');
	const status = passwdEntrySchema.safeParse({username, password, uid: parseInt(uid, 10), gid: parseInt(gid, 10), gecos, home, shell});
	if (!status.success) {
		logger?.info(`Invalid passwd line: ${input}`);
		return undefined;
	}
	return status.data;
}
