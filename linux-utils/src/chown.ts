import * as fsPromise from 'fs/promises';
import {chownSudo} from './lib/chownSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';

/**
 * Change file owner and group, optionally with sudo
 * @param {PathLike} path - The file or directory to change mode
 * @param {number} uid - The user ID.
 * @param {number} gid - The group ID.
 * @param {ILinuxSudoOptions | undefined} options - Options for sudo
 * @returns {Promise<void>} - Promise of the chown
 * @example
 * await chown('./test.txt', 0, 0, {sudo: true});
 */
export function chown(path: PathLike, uid: number, gid: number, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return chownSudo(path, uid, gid, options);
	}
	return fsPromise.chown(path, uid, gid);
}
