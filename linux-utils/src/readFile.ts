import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {readFileSudo} from './lib/readFileSudo';

/**
 * Async read a file from disk, optionally using sudo
 * @param {string} fileName - The file to read
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<Buffer>} - Promise of the file content
 * @example
 * const buffer = await readFile('./test.txt', {sudo: true});
 */
export function readFile(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<Buffer> {
	if (options.sudo) {
		return readFileSudo(fileName, options);
	}
	return fsPromise.readFile(fileName);
}
