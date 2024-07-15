import * as fsPromise from 'fs/promises';
import {execFilePromise, pathLikeToString} from './lib';
import {type Mode, type PathLike} from 'node:fs';
import {type ILinuxSudoOptions} from './lib/sudoUtils';

function octetToString(mode: Mode): string {
	if (typeof mode === 'string') {
		return mode;
	}
	return mode.toString(8);
}

/**
 * Change file or directory mode with sudo and chmod
 *
 * sudo cmd: ['chmod', mode, fileName]
 */
export async function chmodSudo(path: PathLike, mode: Mode, options: ILinuxSudoOptions): Promise<void> {
	await execFilePromise('chmod', [octetToString(mode), pathLikeToString(path)], undefined, {logFuncName: 'chmodSudo', ...options});
}

/**
 * Change file mode, optionally using sudo
 * @param {PathLike} path - The file or directory to change mode
 * @param {Mode} mode - The mode to change the file to (string or number)
 * @param {ILinuxSudoOptions | undefined} options - Options for sudo
 * @returns {Promise<void>} - Promise of the chmod
 * @example
 * await chmod('./test.txt', 0o777, {sudo: true});
 */
export function chmod(path: PathLike, mode: Mode, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return chmodSudo(path, mode, options);
	}
	return fsPromise.chmod(path, mode);
}
