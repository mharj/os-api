import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';
import {writeFileSudo} from './lib/writeFileSudo';

/**
 * Write a file to disk, optionally using sudo
 * @param {PathLike} file - The file to write
 * @param {Buffer} content - The content to write
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<void>} - Promise of write
 * @example
 * await writeFile('./test.txt', Buffer.from('demo'), {sudo: true});
 */
export async function writeFile(file: PathLike, content: Buffer, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options.sudo) {
		return writeFileSudo(file, content, options);
	}
	return fsPromise.writeFile(file, content);
}
