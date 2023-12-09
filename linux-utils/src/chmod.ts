import * as fsPromise from 'fs/promises';
import {chmodSudo} from './lib/chmodSudo';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {Mode} from 'fs';

/**
 * Change file mode, optionally using sudo
 * @param fileName - The file to change mode
 * @param mode - The mode to change the file to (string or number)
 * @param options - Options for sudo
 * @returns Promise<void>
 * @example
 * await chmod('./test.txt', 0o777, {sudo: true});
 */
export function chmod(fileName: string, mode: Mode, options: ILinuxSudoOptions = {sudo: false}): Promise<void> {
	if (options?.sudo) {
		return chmodSudo(fileName, mode, options);
	}
	return fsPromise.chmod(fileName, mode);
}
