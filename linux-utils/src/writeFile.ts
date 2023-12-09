import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {writeFileSudo} from './lib/writeFileSudo';

/**
 *Write a file to disk, optionally using sudo
 * @param {string} fileName - The file to write
 * @param {Buffer} content - The content to write
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of write
 * @example
 * await writeFile('./test.txt', Buffer.from('demo'), {sudo: true});
 */
export async function writeFile(fileName: string, content: Buffer, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return writeFileSudo(fileName, content, options);
	}
	return fsPromise.writeFile(fileName, content);
}
