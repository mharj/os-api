import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {unlinkSudo} from './lib/unlinkSudo';

/**
 * Async delete a file from disk, optionally using sudo
 * @param {string} fileName - The file to delete
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of delete
 * @example
 * await unlink('./test.txt', {sudo: true});
 */
export async function unlink(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return unlinkSudo(fileName, options);
	}
	return fsPromise.unlink(fileName);
}
