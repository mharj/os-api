import {constants} from 'fs';
import {test} from '@avanio/os-api-linux-utils';

/** check if sudo command is available */
export async function osHaveSudo() {
	let haveSudo = false;
	try {
		haveSudo = await test('/usr/bin/sudo', constants.F_OK);
		haveSudo = true;
	} catch (e) {
		haveSudo = false;
	}
	return haveSudo;
}
