import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {PathLike} from 'node:fs';
import {pathLikeToString} from './pathUtils';

/**
 * Rename a file or directory with sudo.
 *
 * sudo cmd: ['mv', '-f', oldPath, newPath]
 */
export async function renameSudo(oldPath: PathLike, newPath: PathLike, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['mv', '-f', pathLikeToString(oldPath), pathLikeToString(newPath)], options);
	getSudoFileLogger()?.debug('renameSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
