import * as fsPromise from 'fs/promises';
import {type BigIntStats, type PathLike} from 'node:fs';
import {type ILinuxSudoOptions} from './lib/sudoUtils';
import {statSudo} from './lib/statSudo';

/**
 * Stat a file or directory, optionally using sudo
 * @param {PathLike} path - The file or directory to stat
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @returns {Promise<BigIntStats>} - Promise of the file stats
 * @example
 * const stats: BigIntStats = await stat('./test.txt', {sudo: true});
 */
export function stat(path: PathLike, options: ILinuxSudoOptions = {sudo: false}): Promise<BigIntStats> {
	if (options.sudo) {
		return statSudo(path, options);
	}
	return fsPromise.stat(path, {bigint: true});
}
