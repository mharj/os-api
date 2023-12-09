import * as fsPromise from 'fs/promises';
import {ILinuxSudoOptions} from './lib/sudoUtils';
import {Stats} from 'fs';
import {statSudo} from './lib/statSudo';

export function stat(fileName: string, options: ILinuxSudoOptions = {sudo: false}): Promise<Stats> {
	if (options.sudo) {
		return statSudo(fileName, options);
	}
	return fsPromise.stat(fileName);
}
