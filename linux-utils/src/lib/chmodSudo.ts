import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {Mode} from 'fs';

function octetToString(mode: Mode): string {
	if (typeof mode === 'string') {
		return mode;
	}
	return mode.toString(8);
}

/**
 * Change file mode with sudo and chmod
 *
 * sudo cmd: ['chmod', mode, fileName]
 */
export async function chmodSudo(fileName: string, mode: Mode, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['chmod', octetToString(mode), fileName], options);
	getSudoFileLogger()?.debug('chmodSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
