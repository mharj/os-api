import * as fsPromise from 'fs/promises';
import {execFilePromise, pathLikeToString} from './lib';
import {type ILinuxSudoOptions} from './lib/sudoUtils';
import {type PathLike} from 'node:fs';

/**
 * Delete file with sudo and unlink
 *
 * sudo cmd: ['unlink', fileName]
 */
export async function unlinkSudo(path: PathLike, options: ILinuxSudoOptions): Promise<void> {
	await execFilePromise('unlink', [pathLikeToString(path)], undefined, {logFuncName: 'unlinkSudo', ...options});
}

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
