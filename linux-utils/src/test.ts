import {constants, PathLike} from 'fs';
import {access} from './access';
import {type ILinuxSudoOptions} from './lib/sudoUtils';

/**
 * Test if a file or directory exists
 * @param {PathLike} path - The file or directory to test
 * @param {number} mode - The mode to test the file with (default: constants.F_OK)
 * @param {ILinuxSudoOptions} options - Options for sudo
 * @example
 * await test('./test.txt', fs.constants.R_OK, {sudo: true}); // boolean
 */
export async function test(path: PathLike, mode: number = constants.F_OK, options: ILinuxSudoOptions = {sudo: false}): Promise<boolean> {
	try {
		await access(path, mode, options);
		return true;
	} catch (error) {
		return false;
	}
}
