import * as fs from 'fs';
import * as path from 'path';
import {AbstractLinuxHosts, HostEntry, IErrorLike, isValidLine, parseHostLine, ServiceStatusObject} from '@avanio/os-api-shared';
import {execFilePromise, ILinuxSudoOptions, accessFilePromise} from '@avanio/os-api-linux-utils';
import {ILoggerLike} from '@avanio/logger-like';

type LinuxHostsDbProps = {
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
};

const initialProps: Required<LinuxHostsDbProps> & ILinuxSudoOptions = {
	file: '/var/lib/misc/hosts.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
};

export class LinuxHostsDb extends AbstractLinuxHosts {
	public readonly name = 'LinuxHostsDb';
	private logger?: ILoggerLike;
	public props: Required<LinuxHostsDbProps> & ILinuxSudoOptions;
	constructor(props: LinuxHostsDbProps & ILinuxSudoOptions, logger?: ILoggerLike) {
		super();
		this.props = {...initialProps, ...props};
		this.logger = logger;
	}

	public async status(): Promise<ServiceStatusObject> {
		const errors: IErrorLike[] = [];
		try {
			// check if we can access the file and have write access
			await accessFilePromise(this.props.file, fs.constants.W_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no db file ${this.props.file} found or write access denied`});
		}
		try {
			// check if we can access the makedb executable and have execute access
			await accessFilePromise(this.props.makedb, fs.constants.X_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no makedb executable found from ${this.props.makedb} or access denied`});
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

	protected toOutput(value: HostEntry): string {
		return `${value.address} ${value.hostname} ${value.aliases.join(' ')}`;
	}

	protected fromOutput(value: string): HostEntry | undefined {
		if (isValidLine(value)) {
			return parseHostLine(value, this.logger);
		}
		return undefined;
	}

	protected async storeOutput(value: string[]): Promise<void> {
		const {cmd, args} = this.buildExecParams(['--quiet', '-o', path.resolve(this.props.file), '-']);
		this.logger?.debug('LinuxHostsDb::storeOutput:', cmd, args);
		await execFilePromise(cmd, args, Buffer.from(value.join('\n')));
	}

	protected async loadOutput(): Promise<string[]> {
		const {cmd, args} = this.buildExecParams(['--quiet', '-u', path.resolve(this.props.file)]);
		this.logger?.debug('LinuxHostsDb::loadOutput:', cmd, args);
		const data = await execFilePromise(cmd, args);
		return data.toString().split('\n');
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
