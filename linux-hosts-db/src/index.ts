import * as fs from 'fs';
import * as path from 'path';
import {
	AbstractLinuxFileDatabase,
	HostEntry,
	HostFileEntry,
	IErrorLike,
	isValidLine,
	parseHostLine,
	ServiceStatusObject,
	validateLinuxHostsEntry,
} from '@avanio/os-api-shared';
import {access, copyFile, execFilePromise, ILinuxSudoOptions} from '@avanio/os-api-linux-utils';
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
	/**
	 * Create a backup of the database file before writing
	 * @default false
	 */
	backup?: boolean;
	/**
	 * Backup file path
	 * @default '/var/lib/misc/hosts.db.bak'
	 */
	backupFile?: string;
};

const initialProps = {
	backup: false,
	backupFile: '/var/lib/misc/hosts.db.bak',
	file: '/var/lib/misc/hosts.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
} satisfies Required<LinuxHostsDbProps> & ILinuxSudoOptions;

export class LinuxHostsDb extends AbstractLinuxFileDatabase<HostEntry, HostFileEntry> {
	public readonly name = 'LinuxHostsDb';
	private logger?: ILoggerLike;
	public props: Required<LinuxHostsDbProps> & ILinuxSudoOptions;
	constructor(props: LinuxHostsDbProps & ILinuxSudoOptions = {}, logger?: ILoggerLike) {
		super();
		this.props = {...initialProps, ...props};
		this.logger = logger;
	}

	/**
	 * Add new entry to hosts, overriden to handle backup restore
	 * @param value - HostEntry
	 * @param index - optional index to insert entry at
	 * @returns promise that resolves to true if write was successful
	 */
	public override async add(value: HostEntry, index?: number): Promise<boolean> {
		return this.handleRestore(super.add(value, index));
	}

	/**
	 * Replace current hosts entry with new one, overriden to handle backup restore
	 * @param current - HostFileEntry
	 * @param replace - HostEntry
	 * @returns promise that resolves to true if write was successful
	 */
	public override async replace(current: HostFileEntry, replace: HostEntry): Promise<boolean> {
		return this.handleRestore(super.replace(current, replace));
	}

	/**
	 * Delete hosts entry, overriden to handle backup restore
	 * @param value - HostFileEntry
	 * @returns promise that resolves to true if write was successful
	 */
	public override async delete(value: HostFileEntry): Promise<boolean> {
		return this.handleRestore(super.delete(value));
	}

	public async status(): Promise<ServiceStatusObject> {
		const errors: IErrorLike[] = [];
		try {
			// check if we can access the file and have write access
			await access(this.props.file, fs.constants.W_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no db file ${this.props.file} found or write access denied`});
		}
		try {
			// check if we can access the makedb executable and have execute access
			await access(this.props.makedb, fs.constants.X_OK, this.props);
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

	protected async verifyWrite(value: HostEntry): Promise<boolean> {
		const line = this.toOutput(value);
		return (await this.listRaw()).some((v) => v === line);
	}

	protected async storeOutput(value: string[]): Promise<void> {
		if (this.props.backup) {
			this.logger?.debug(`${this.name}::backup`, this.props.backupFile);
			await copyFile(this.props.file, this.props.backupFile, undefined, this.props);
		}
		const {cmd, args} = this.buildExecParams(['--quiet', '-o', path.resolve(this.props.file), '-']);
		this.logger?.debug(`${this.name}::storeOutput:`, cmd, args);
		await execFilePromise(cmd, args, Buffer.from(value.join('\n')));
	}

	protected async loadOutput(): Promise<string[]> {
		const {cmd, args} = this.buildExecParams(['--quiet', '-u', path.resolve(this.props.file)]);
		this.logger?.debug(`${this.name}::loadOutput:`, cmd, args);
		const data = await execFilePromise(cmd, args);
		return data.toString().split('\n');
	}

	protected isSameEntry(a: HostEntry | HostFileEntry, b: HostEntry | HostFileEntry | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.hostname === b.hostname && a.address === b.address;
	}

	protected validateEntry(entry: HostEntry): void {
		validateLinuxHostsEntry(entry);
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

	/**
	 * if write fails and backup is enabled, restores backup file
	 * @param isWriteOk - promise that resolves to true if write was successful
	 * @returns promise that resolves to true if write was successful
	 */
	private async handleRestore(isWriteOk: Promise<boolean>): Promise<boolean> {
		const status = await isWriteOk;
		if (!status && this.props.backup) {
			this.logger?.warn(`${this.name}: Write failed, restoring backup file ${this.props.backupFile}`);
			await copyFile(this.props.backupFile, this.props.file, undefined, this.props);
		}
		return status;
	}
}
