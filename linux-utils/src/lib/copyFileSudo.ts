import {constants, PathLike} from 'node:fs';
import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {accessSudo} from './accessSudo';
import {execFilePromise} from './execFilePromise';
import {pathLikeToString} from './pathUtils';

export async function copyFileSudo(src: PathLike, dest: PathLike, mode: number | undefined, options: ILinuxSudoOptions): Promise<void> {
	if (mode) {
		switch (mode) {
			case constants.COPYFILE_EXCL: {
				try {
					await accessSudo(dest, constants.F_OK, options);
					throw new Error(`${pathLikeToString(dest)} already exists`);
				} catch (err) {
					// File does not exist, continue
				}
				break;
			}
			case constants.COPYFILE_FICLONE: {
				throw new Error('COPYFILE_FICLONE is not supported');
			}
			case constants.COPYFILE_FICLONE_FORCE: {
				throw new Error('COPYFILE_FICLONE_FORCE is not supported');
			}
		}
	}
	const [cmd, ...args] = sudoArgs(['cp', '-f', '--recursive', pathLikeToString(src), pathLikeToString(dest)], options);
	getSudoFileLogger()?.debug('copyFileSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
