import * as fsPromise from 'fs/promises';
import {chownSudo} from './lib/chownSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';

/**
 * Change file owner and group, optionally with sudo
 * @param fileName - The file to change mode
 * @param uid - The user id to change to
 * @param gid - The group id to change to
 * @param options - Options for sudo
 * @returns Promise<void>
 * @example
 * await chown('./test.txt', 0, 0, {sudo: true});
 */
export function chown(fileName: string, uid: number, gid: number, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options?.sudo) {
		return chownSudo(fileName, uid, gid, options);
	}
	return fsPromise.chown(fileName, uid, gid);
}
