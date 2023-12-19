import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';
import {unlinkSudo} from './lib/unlinkSudo';

/**
 * Async remove a file from disk, optionally using sudo
 * @param {PathLike} path - The file to unlink
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of unlink
 * @example
 * await unlink('./test.txt', {sudo: true});
 */
export async function unlink(path: PathLike, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return unlinkSudo(path, options);
	}
	return fsPromise.unlink(path);
}
