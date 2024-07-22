import {type DistinctKey, nssConfLineBuilder, type NssEntry, parseNssConfLine, validateLinuxNssEntry} from '../../src';
import {AbstractLinuxMock} from './AbstractLinuxMock';

export function buildOutput(value: NssEntry): string {
	const data = nssConfLineBuilder(value);
	if (parseNssConfLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

const rawData = `# /etc/nsswitch.conf
#
# Example configuration of GNU Name Service Switch functionality.
# If you have the 'glibc-doc-reference' and 'info' packages installed, try:
# 'info libc "Name Service Switch"' for information about this file.

passwd:         files
group:          files
shadow:         files
gshadow:        files

hosts:          files dns
networks:       files

protocols:      db files
services:       db files
ethers:         db files
rpc:            db files

netgroup:       nis`;

export class MockLinuxNssConf extends AbstractLinuxMock<NssEntry> {
	public readonly name = 'MockLinuxNssConf';
	protected _data = new Map<number, string>(rawData.split('\n').map((line, index) => [index, line]));

	protected toOutput(value: NssEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): NssEntry | undefined {
		return parseNssConfLine(value, this.logger);
	}

	protected isSameEntry(a: NssEntry | DistinctKey<NssEntry, number>, b: NssEntry | DistinctKey<NssEntry, number> | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.database === b.database;
	}

	protected validateEntry(entry: NssEntry): void {
		validateLinuxNssEntry(entry);
	}
}
