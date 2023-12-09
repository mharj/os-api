import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {constants} from 'fs';
import {execFilePromise} from './execFilePromise';

/**
 * Convert mode to test arg
 */
function buildTestArg(mode?: number) {
	switch (mode) {
		case constants.X_OK:
			return '-x';
		case constants.W_OK:
			return '-w';
		case constants.R_OK:
			return '-r';
		case constants.F_OK:
		default:
			return '-e';
	}
}
/**
 * Check if a file can be accessed with sudo
 *
 * sudo cmd: ['test', mode, fileName]
 */
export async function accessSudo(fileName: string, mode: number = constants.F_OK, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['test', buildTestArg(mode), fileName], options);
	getSudoFileLogger()?.debug('accessSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
