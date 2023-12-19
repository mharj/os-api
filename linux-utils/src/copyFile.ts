import * as fsPromise from 'fs/promises';
import {copyFileSudo} from './lib/copyFileSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';

/**
 * Copy file or directory, optionally with sudo
 * @param {PathLike} src - The file or directory to copy
 * @param {PathLike} dest - The destination file or directory
 * @param {number | undefined} mode - Optional modifiers that specify the behavior of the copy operation.
 * @param {ILinuxSudoOptions | undefined} options - Options for sudo
 * @returns {Promise<void>} - Promise of the copy
 * @example
 * await copyFile('./test.txt', './test.txt.backup', undefined, {sudo: true});
 * await copyFile('./test.txt', './test.txt.backup', fs.constants.COPYFILE_EXCL, {sudo: true});
 */
export function copyFile(src: PathLike, dest: PathLike, mode: number | undefined, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return copyFileSudo(src, dest, mode, options);
	}
	return fsPromise.copyFile(src, dest, mode);
}
