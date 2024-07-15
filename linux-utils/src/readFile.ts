import * as fsPromise from 'fs/promises';
import {execFilePromise, pathLikeToString} from './lib';
import {type ILinuxSudoOptions} from './lib/sudoUtils';
import {type PathLike} from 'node:fs';

/**
 * Async read file with sudo and cat
 *
 * sudo cmd: ['cat', fileName]
 */
export function readFileSudo(path: PathLike, options: ILinuxSudoOptions): Promise<Buffer> {
	return execFilePromise('cat', [pathLikeToString(path)], undefined, {logFuncName: 'readFileSudo', ...options});
}

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
