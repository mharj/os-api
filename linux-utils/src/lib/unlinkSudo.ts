import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';

/**
 * Delete file with sudo and rm
 *
 * sudo cmd: ['rm', '-f', fileName]
 */
export async function unlinkSudo(fileName: string, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['rm', '-f', fileName], options);
	getSudoFileLogger()?.debug('unlinkSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
