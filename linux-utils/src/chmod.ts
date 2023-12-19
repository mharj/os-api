import * as fsPromise from 'fs/promises';
import {Mode, PathLike} from 'node:fs';
import {chmodSudo} from './lib/chmodSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';

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
