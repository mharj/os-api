import * as fs from 'fs';
import {test} from '../../../test';
import {execFilePromise} from '../../execFilePromise';

export const lsbReleaseKeys = ['Distributor ID', 'Description', 'Release', 'Codename'] as const;

type LsbReleaseKey = (typeof lsbReleaseKeys)[number];

export type LinuxLsbRelease = Record<LsbReleaseKey, string>;

export function haveLsbRelease(): Promise<boolean> {
	return test('/usr/bin/lsb_release', fs.constants.X_OK);
}

export async function getLsbRelease(): Promise<LinuxLsbRelease> {
	const rawData = (await execFilePromise('lsb_release', ['-a'])).toString().split('\n');
	return rawData.reduce<LinuxLsbRelease>(
		(acc, line) => {
			const [key, value] = line.split(':', 2);
			if (lsbReleaseKeys.includes(key as LsbReleaseKey)) {
				acc[key as LsbReleaseKey] = value.trim();
			}
			return acc;
		},
		{Codename: '', Description: '', 'Distributor ID': '', Release: ''},
	);
}
