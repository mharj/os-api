import {isIP} from 'net';
import {readFile, writeFile, LinuxFileOptions} from '@avanio/os-api-linux-utils';

const isValidHostnameRegex = /^[a-z\.\-0-9]+$/;
function isValidHostname(hostname: string): boolean {
	return isValidHostnameRegex.test(hostname);
}

export interface IHostFileEntry {
	line: number;
	address: string;
	hostname: string;
	aliases: string[];
}

export interface IHostEntry {
	address: string;
	hostname: string;
	aliases: string[];
}

interface IHostsApiFunctions {
	list(): Promise<IHostFileEntry[]>;
	delete(value: IHostFileEntry): Promise<boolean>;
	add(value: IHostEntry, index?: number): Promise<boolean>;
}



interface LinuxHostsProps extends LinuxFileOptions {
	file?: string;
}

const initialProps: Required<LinuxHostsProps> = {
	file: '/etc/hosts',
	sudo: false,
	sudoUser: 'root',
};



export class LinuxHosts implements IHostsApiFunctions {
	public readonly name = 'linux-hosts-file';
	public readonly version = 1;

	public props: Required<LinuxHostsProps>;
	constructor(props: LinuxHostsProps) {
		this.props = {...initialProps, ...props};
	}
	async list(): Promise<IHostFileEntry[]> {
		return this.parseLines(await this.readRawLines());
	}
	async delete(value: IHostFileEntry): Promise<boolean> {
		const entryList = await this.list();
		const index = entryList.findIndex((entry) => entry.line === value.line && entry.address === value.address && entry.hostname === value.hostname);
		if (index !== -1) {
			entryList.splice(index, 1);
			this.writeRawLines(entryList.map(this.entryToLine));
			return true;
		}
		const entry = entryList.find((entry) => entry.hostname === value.hostname);
		if (entry && value.line !== entry.line) {
			throw new Error('Hostfile might have been changed since the entry was read');
		}
		return false;
	}
	async add(value: IHostEntry, index?: number | undefined): Promise<boolean> {
		if (!isIP(value.address)) {
			throw new TypeError(`Invalid IP address value: ${value.address}`);
		}
		if (!isValidHostname(value.hostname)) {
			throw new TypeError(`Invalid hostname value: ${value.hostname}`);
		}
		if (!value.aliases.every(isValidHostname)) {
			throw new TypeError(`Invalid alias value in: ${JSON.stringify(value.aliases)}`);
		}
		const lines = await this.readRawLines();
		const outLine = `${value.address} ${value.hostname} ${value.aliases.join(' ')}`;
		if (index === undefined || index > lines.length) {
			lines.push(outLine);
		} else {
			lines.splice(index, 0, outLine);
		}
		this.writeRawLines(lines);
		return true;
	}
	private parseLines(lines: string[]): IHostFileEntry[] {
		return lines.reduce<IHostFileEntry[]>((output, line, index) => {
			// cleanup line
			line = line.replace(/\s+/g, ' ').trim();
			if (line.length > 0 && !line.startsWith('#')) {
				const [address, hostname, ...aliases] = line.split(' ');
				if (address && isIP(address) && hostname) {
					output.push({line: index, address, hostname, aliases});
				}
			}
			return output;
		}, []);
	}
	private entryToLine(entry: IHostFileEntry): string {
		return `${entry.address} ${entry.hostname} ${entry.aliases.join(' ')}`;
	}
	private async readRawLines(): Promise<string[]> {
		return readFile(this.props.file, {sudo: this.props.sudo}).toString().split('\n');
	}
	private writeRawLines(lines: string[]) {
		writeFile(this.props.file, Buffer.from(lines.join('\n')), {sudo: this.props.sudo});
	}
}
