import * as fsPromise from 'fs/promises';
import {accessSudo} from './lib/accessSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';

/**
 * Access a file or directory on disk, optionally using sudo
 * @param {PathLike} path - The file or directory to access
 * @param {mode | undefined} mode - The mode to access the file with
 * @param {ILinuxSudoOptions | undefined} options - Options for sudo
 * @throws {Error} - If the file cannot be accessed
 * @returns {Promise<void>} - Promise of the access
 * @example
 * await access('./test.txt', fs.constants.R_OK, {sudo: true});
 */
export function access(path: PathLike, mode?: number, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return accessSudo(path, mode, options);
	}
	return fsPromise.access(path, mode);
}
