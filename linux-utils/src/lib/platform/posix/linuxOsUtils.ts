import * as fs from 'fs';
import {getLsbRelease, haveLsbRelease} from './lsbRelease';
import {getOsRelease, haveOsRelease} from './osRelease';
import {test} from '../../../test';

export async function getDistributionId(): Promise<string> {
	if (await haveLsbRelease()) {
		return (await getLsbRelease())['Distributor ID'];
	}
	if (await haveOsRelease()) {
		const osRelease = await getOsRelease();
		if (osRelease.ID) {
			return osRelease.ID;
		}
	}
	return checkDistributionIdFromReleaseFiles();
}

// https://gist.github.com/lesstif/bdc8498ca3c649a2d7521cf1093026a9
// https://github.com/higanworks/os_catalog/tree/master/linux
export async function checkDistributionIdFromReleaseFiles(): Promise<string> {
	// RedHat based distributions
	if (await test('/etc/redhat-release', fs.constants.R_OK)) {
		return 'unknown-redhat-based';
	}
	// Debian based distributions
	if (await test('/etc/debian_version', fs.constants.R_OK)) {
		return 'unknown-debian-based';
	}
	// SUSE based distributions
	if (await test('/etc/SuSE-release', fs.constants.R_OK)) {
		return 'unknown-suse-based';
	}
	// Slackware based distributions
	if (await test('/etc/slackware-version', fs.constants.R_OK)) {
		return 'unknown-slackware-based';
	}
	return 'unknown-linux-based';
}
