import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';

/**
 * Async write file with sudo and tee
 *
 * sudo cmd: ['tee', fileName] < content
 */
export async function writeFileSudo(fileName: string, content: Buffer, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['tee', fileName], options);
	getSudoFileLogger()?.debug('writeFileSudo:', cmd, args);
	await execFilePromise(cmd, args, content);
}
