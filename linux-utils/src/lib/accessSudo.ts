import {constants, PathLike} from 'node:fs';
import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';
import {pathLikeToString} from './pathUtils';

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
export async function accessSudo(path: PathLike, mode: number = constants.F_OK, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['test', buildTestArg(mode), pathLikeToString(path)], options);
	getSudoFileLogger()?.debug('accessSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
