import {execFileSync} from 'child_process';
import {access as accessFile} from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import {isIP} from 'net';
import {ServiceState} from '@avanio/os-api-shared/types/service';
import {ErrorLike} from '@avanio/os-api-shared/types/ErrorLike';

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
	status(): Promise<ServiceState>;
	list(): Promise<IHostFileEntry[]>;
	delete(value: IHostFileEntry): Promise<boolean>;
	add(value: IHostEntry): Promise<boolean>;
}

interface LinuxHostsProps {
	/**
	 * NSS database file path
	 *
	 * @default '/var/lib/misc/hosts.db' as for Debian/Ubuntu based systems.
	 */
	file?: string;
	/**
	 * Makedb command path
	 * @default '/usr/bin/makedb'
	 */
	makedb?: string;
	/**
	 * Do we need to use sudo to access the db file.
	 * @default false
	 */
	sudo?: boolean;
}

const initialProps: Required<LinuxHostsProps> = {
	file: '/var/lib/misc/hosts.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
};

export class LinuxHostsDb implements IHostsApiFunctions {
	public readonly name = 'linux-hosts';
	public readonly version = 1;
	public props: Required<LinuxHostsProps>;
	constructor(props: LinuxHostsProps) {
		this.props = {...initialProps, ...props};
	}
	async status(): Promise<ServiceState> {
		const errors: ErrorLike[] = [];
		try {
			await accessFile(this.props.file, fs.constants.W_OK);
		} catch (e) {
			errors.push({name: 'FileError', message: 'no db file found or access denied'});
		}
		try {
			await accessFile(this.props.makedb, fs.constants.X_OK);
		} catch (e) {
			errors.push({name: 'FileError', message: 'no makedb executable found or access denied'});
		}
		if (errors.length > 0) {
			return {
				status: 'error',
				errors,
			};
		} else {
			return {
				status: 'online',
			};
		}
	}
	async list(): Promise<IHostFileEntry[]> {
		return this.parseLines(this.readRawLines());
	}
	async delete(value: IHostFileEntry): Promise<boolean> {
		const lines = await this.list();
		const index = lines.findIndex((entry) => entry.line === value.line && entry.address === value.address && entry.hostname === value.hostname);
		if (index !== -1) {
			lines.splice(index, 1);
			this.writeRawLines(lines.map(this.entryToString));
			return true;
		}
		const entry = lines.find((entry) => entry.hostname === value.hostname);
		if (entry && value.line !== entry.line) {
			throw new Error('Hostfile might have been changed since the entry was read');
		}
		return false;
	}
	async add(value: IHostEntry): Promise<boolean> {
		if (!isIP(value.address)) {
			throw new TypeError(`Invalid IP address value: ${value.address}`);
		}
		if (!isValidHostname(value.hostname)) {
			throw new TypeError(`Invalid hostname value: ${value.hostname}`);
		}
		if (!value.aliases.every(isValidHostname)) {
			throw new TypeError(`Invalid alias value in: ${JSON.stringify(value.aliases)}`);
		}
		const lines = this.readRawLines();
		const outLine = `${value.address} ${value.hostname} ${value.aliases.join(' ')}`;
		lines.push(outLine);
		this.writeRawLines(lines);
		return true;
	}
	private entryToString(entry: IHostFileEntry): string {
		return `${entry.address} ${entry.hostname} ${entry.aliases.join(' ')}`;
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
	private readRawLines(): string[] {
		const {cmd, args} = this.buildExecParams(['--quiet', '-u', path.resolve(this.props.file)]);
		const data = execFileSync(cmd, args);
		return data.toString().split('\n');
	}
	private writeRawLines(lines: string[]): void {
		const {cmd, args} = this.buildExecParams(['--quiet', '-o', path.resolve(this.props.file), '-']);
		execFileSync(cmd, args, {input: lines.join('\n')});
	}
	private buildExecParams(args: string[]): {cmd: string; args: string[]} {
		const newArgs = [this.props.makedb, ...args];
		if (this.props.sudo) {
			newArgs.unshift('sudo', '-b'); // add sudo and sudo background mode
		}
		const cmd = newArgs.shift();
		if (!cmd) {
			throw new Error('No command found');
		}
		return {cmd, args: newArgs};
	}
}
