import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {PathLike} from 'node:fs';
import {pathLikeToString} from './pathUtils';

/**
 * Async read file with sudo and cat
 *
 * sudo cmd: ['cat', fileName]
 */
export function readFileSudo(path: PathLike, options: ILinuxSudoOptions): Promise<Buffer> {
	const [cmd, ...args] = sudoArgs(['cat', pathLikeToString(path)], options);
	getSudoFileLogger()?.debug('readFileSudo:', cmd, args);
	return execFilePromise(cmd, args);
}
