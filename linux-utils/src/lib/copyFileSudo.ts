import {constants, existsSync} from 'fs';
import {getSudoFileLogger, ILinuxSudoOptions, sudoArgs} from './sudoUtils';
import {execFilePromise} from './execFilePromise';

export async function copyFileSudo(source: string, destination: string, mode: number | undefined, options: ILinuxSudoOptions): Promise<void> {
	if (mode) {
		switch (mode) {
			case constants.COPYFILE_EXCL: {
				if (existsSync(destination)) {
					throw new Error(`${destination} already exists`);
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
	const [cmd, ...args] = sudoArgs(['cp', '-f', source, destination], options);
	getSudoFileLogger()?.debug('copyFileSudo:', cmd, args);
	await execFilePromise(cmd, args);
}
