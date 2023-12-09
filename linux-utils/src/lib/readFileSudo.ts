import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';

/**
 * Async read file with sudo and cat
 *
 * sudo cmd: ['cat', fileName]
 */
export function readFileSudo(fileName: string, options: ILinuxSudoOptions): Promise<Buffer> {
	const [cmd, ...args] = sudoArgs(['cat', fileName], options);
	getSudoFileLogger()?.debug('readFileSudo:', cmd, args);
	return execFilePromise(cmd, args);
}
