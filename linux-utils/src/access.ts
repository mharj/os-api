import * as fsPromise from 'fs/promises';
import {accessSudo} from './lib/accessSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';

/**
 * Access a file on disk, optionally using sudo
 * @param fileName - The file to access
 * @param mode - The mode to access the file with
 * @param options - Options for sudo
 * @throws {Error} - If the file cannot be accessed
 * @returns Promise<void>
 * @example
 * await access('./test.txt', fs.constants.R_OK, {sudo: true});
 */
export function access(fileName: string, mode?: number, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options?.sudo) {
		return accessSudo(fileName, mode, options);
	}
	return fsPromise.access(fileName, mode);
}
