import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {PathLike} from 'node:fs';
import {readFileSudo} from './lib/readFileSudo';

/**
 * Async read a file from disk, optionally using sudo
 * @param {PathLike} path - The file to read
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<Buffer>} - Promise of the file content
 * @example
 * const buffer = await readFile('./test.txt', {sudo: true});
 */
export function readFile(path: PathLike, options: ILinuxSudoOptions = {sudo: false}): Promise<Buffer> {
	if (options.sudo) {
		return readFileSudo(path, options);
	}
	return fsPromise.readFile(path);
}
