import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';
import {renameSudo} from './lib/renameSudo';

/**
 * Rename a file or directory, optionally using sudo.
 * @param {PathLike} oldPath - The old path
 * @param {PathLike} newPath - The new path
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of the rename
 * @example
 * await rename('./test.txt', './test2.txt', {sudo: true});
 */
export function rename(oldPath: PathLike, newPath: PathLike, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return renameSudo(oldPath, newPath, options);
	}
	return fsPromise.rename(oldPath, newPath);
}
