import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {PathLike} from 'node:fs';
import {pathLikeToString} from './pathUtils';

/**
 * Async write file with sudo and tee
 *
 * sudo cmd: ['tee', file] < content
 */
export async function writeFileSudo(file: PathLike, content: Buffer, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['tee', pathLikeToString(file)], options);
	getSudoFileLogger()?.debug('writeFileSudo:', cmd, args);
	await execFilePromise(cmd, args, content);
}
