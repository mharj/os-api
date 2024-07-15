import * as fsPromise from 'fs/promises';
import {execFilePromise, pathLikeToString} from './lib/';
import {constants} from 'fs';
import {type ILinuxSudoOptions} from './lib/sudoUtils';
import {type PathLike} from 'node:fs';

/**
 * Convert mode to test arg
 */
function buildTestArg(mode?: number) {
	switch (mode) {
		case constants.X_OK:
			return '-x';
		case constants.W_OK:
			return '-w';
		case constants.R_OK:
			return '-r';
		case constants.F_OK:
		default:
			return '-e';
	}
}

/**
 * Check if a file can be accessed with sudo
 *
 * sudo cmd: ['test', mode, fileName]
 */
export async function accessSudo(path: PathLike, mode: number = constants.F_OK, options: ILinuxSudoOptions): Promise<void> {
	await execFilePromise('test', [buildTestArg(mode), pathLikeToString(path)], undefined, {logFuncName: 'accessSudo', ...options});
}

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
