import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {Mode, PathLike} from 'node:fs';
import {execFilePromise} from './execFilePromise';
import {pathLikeToString} from './pathUtils';

function octetToString(mode: Mode): string {
	if (typeof mode === 'string') {
		return mode;
	}
	return mode.toString(8);
}

/**
 * Change file or directory mode with sudo and chmod
 *
 * sudo cmd: ['chmod', mode, fileName]
 */
export async function chmodSudo(path: PathLike, mode: Mode, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['chmod', octetToString(mode), pathLikeToString(path)], options);
	getSudoFileLogger()?.debug('chmodSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
