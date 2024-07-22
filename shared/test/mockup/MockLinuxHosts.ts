import {type DistinctKey, type HostEntry, hostLineBuilder, parseHostLine, validateLinuxHostsEntry} from '../../src/';
import {AbstractLinuxMock} from './AbstractLinuxMock';

export function buildOutput(value: HostEntry): string {
	const data = hostLineBuilder(value);
	if (parseHostLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

const rawData = `127.0.0.1       localhost

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters

172.17.0.2      528db6b8a5eb`;

export class MockLinuxHosts extends AbstractLinuxMock<HostEntry> {
	public readonly name = 'MockLinuxHosts';

	protected _data = new Map<number, string>(rawData.split('\n').map((line, index) => [index, line]));

	protected toOutput(value: HostEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): HostEntry | undefined {
		return parseHostLine(value, this.logger);
	}

	protected isSameEntry(a: HostEntry | DistinctKey<HostEntry, number>, b: HostEntry | DistinctKey<HostEntry, number> | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.hostname === b.hostname && a.address === b.address;
	}

	protected validateEntry(entry: HostEntry): void {
		validateLinuxHostsEntry(entry);
	}
}
