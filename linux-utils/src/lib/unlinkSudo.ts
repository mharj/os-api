import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {PathLike} from 'node:fs';
import {pathLikeToString} from './pathUtils';

/**
 * Delete file with sudo and unlink
 *
 * sudo cmd: ['unlink', fileName]
 */
export async function unlinkSudo(path: PathLike, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['unlink', pathLikeToString(path)], options);
	getSudoFileLogger()?.debug('unlinkSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
