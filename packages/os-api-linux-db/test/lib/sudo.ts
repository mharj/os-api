import {test} from '@avanio/os-api-linux-utils';
import {constants} from 'fs';

/** check if sudo command is available */
export async function osHaveSudo(): Promise<boolean> {
	let haveSudo = false;
	try {
		haveSudo = await test('/usr/bin/sudo', constants.F_OK);
		haveSudo = true;
	} catch (_e) {
		haveSudo = false;
	}
	return haveSudo;
}
