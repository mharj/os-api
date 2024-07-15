import * as fsPromise from 'fs/promises';
import {execFilePromise, pathLikeToString} from './lib';
import {type ILinuxSudoOptions} from './lib/sudoUtils';
import {type PathLike} from 'node:fs';

/**
 * Rename a file or directory with sudo.
 *
 * sudo cmd: ['mv', '-f', oldPath, newPath]
 */
export async function renameSudo(oldPath: PathLike, newPath: PathLike, options: ILinuxSudoOptions): Promise<void> {
	await execFilePromise('mv', ['-f', pathLikeToString(oldPath), pathLikeToString(newPath)], undefined, {logFuncName: 'renameSudo', ...options});
}

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
