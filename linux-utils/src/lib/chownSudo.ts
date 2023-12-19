import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {PathLike} from 'node:fs';
import {pathLikeToString} from './pathUtils';

/**
 * Change file mode with sudo and chmod
 *
 * sudo cmd: ['chown', `${uid}:${gid}`, fileName]
 */
export async function chownSudo(path: PathLike, uid: number, gid: number, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['chown', `${uid}:${gid}`, pathLikeToString(path)], options);
	getSudoFileLogger()?.debug('chownSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
