import * as fs from 'fs';
import {test} from '../../../test';

export const osReleaseKeys = ['PRETTY_NAME', 'NAME', 'VERSION', 'VERSION_ID', 'VERSION_CODENAME', 'ID'] as const;

type OsReleaseKey = (typeof osReleaseKeys)[number];

export type LinuxOsRelease = Partial<Record<OsReleaseKey, string>>;

export function haveOsRelease() {
	return test('/etc/os-release', fs.constants.R_OK);
}

export async function getOsRelease(): Promise<LinuxOsRelease> {
	const rawData = (await fs.promises.readFile('/etc/os-release', 'utf8')).replace(/"/g, '').split('\n');
	return rawData.reduce<LinuxOsRelease>((acc, line) => {
		const [key, value] = line.split('=', 2);
		if (osReleaseKeys.includes(key as OsReleaseKey)) {
			acc[key as OsReleaseKey] = value;
		}
		return acc;
	}, {});
}
