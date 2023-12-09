import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';

/**
 * Change file mode with sudo and chmod
 *
 * sudo cmd: ['chown', `${uid}:${gid}`, fileName]
 */
export async function chownSudo(fileName: string, uid: number, gid: number, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['chown', `${uid}:${gid}`, fileName], options);
	getSudoFileLogger()?.debug('chownSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
