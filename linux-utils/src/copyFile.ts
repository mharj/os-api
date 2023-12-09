import * as fsPromise from 'fs/promises';
import {copyFileSudo} from './lib/copyFileSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';

/**
 * Copy file, optionally with sudo
 * @param source - The file to copy
 * @param destination - The destination file
 * @param mode - Optional modifiers that specify the behavior of the copy operation.
 * @param options - Options for sudo
 * @returns Promise<void>
 * @example
 * await copyFile('./test.txt', './test.txt.backup', undefined, {sudo: true});
 * await copyFile('./test.txt', './test.txt.backup', fs.constants.COPYFILE_EXCL, {sudo: true});
 */
export function copyFile(source: string, destination: string, mode: number | undefined, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return copyFileSudo(source, destination, mode, options);
	}
	return fsPromise.copyFile(source, destination, mode);
}
