import {execFilePromise, isExecFileException} from './lib/execFilePromise';
import {assertLinuxPlatform} from './lib/platform/posix/linuxPlatform';
import {type ILinuxSudoOptions} from './lib/sudoUtils';

export type GetEntPros = {
	service?: string;
} & ILinuxSudoOptions;

export async function getEnt(database: string, key?: string, props: GetEntPros = {}): Promise<string> {
	assertLinuxPlatform('getent is only supported on Linux');
	const options = [database];
	if (key) {
		options.push(key);
	}
	if (props.service) {
		options.push(...['-s', props.service]);
	}
	try {
		const data = await execFilePromise('getent', options, undefined, {logFuncName: 'getEnt', ...props});
		return data.toString().trim();
	} catch (error) {
		if (isExecFileException(error)) {
			switch (error.code) {
				case 1:
					throw new Error('getEnt: Missing arguments, or database unknown.');
				case 2:
					throw new Error('getEnt: One or more supplied key could not be found in the database.');
				case 3:
					throw new Error('getEnt: Enumeration not supported on this database.');
			}
		}
		throw error;
	}
}
