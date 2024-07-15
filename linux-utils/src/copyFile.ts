import * as fsPromise from 'fs/promises';
import {constants, type PathLike} from 'node:fs';
import {execFilePromise, pathLikeToString} from './lib';
import {accessSudo} from './access';
import {type ILinuxSudoOptions} from './lib/sudoUtils';

export async function copyFileSudo(src: PathLike, dest: PathLike, mode: number | undefined, options: ILinuxSudoOptions): Promise<void> {
	if (mode) {
		switch (mode) {
			case constants.COPYFILE_EXCL: {
				try {
					await accessSudo(dest, constants.F_OK, options);
					throw new Error(`${pathLikeToString(dest)} already exists`);
				} catch (err) {
					// File does not exist, continue
				}
				break;
			}
			case constants.COPYFILE_FICLONE: {
				throw new Error('COPYFILE_FICLONE is not supported');
			}
			case constants.COPYFILE_FICLONE_FORCE: {
				throw new Error('COPYFILE_FICLONE_FORCE is not supported');
			}
		}
	}
	await execFilePromise('cp', ['-f', '--recursive', pathLikeToString(src), pathLikeToString(dest)], undefined, {logFuncName: 'copyFileSudo', ...options});
}

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
