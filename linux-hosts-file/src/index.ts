import * as fs from 'fs';
import {AbstractLinuxHosts, HostEntry, HostFileEntry, IErrorLike, isValidLine, parseHostLine, ServiceStatusObject} from '@avanio/os-api-shared';
import {access, copyFile, ILinuxSudoOptions, readFile, unlink, writeFile} from '@avanio/os-api-linux-utils';
import {ILoggerLike} from '@avanio/logger-like';

type LinuxHostsProps = {
	/** hosts file path, defaults to /etc/hosts */
	file?: string;
	/** backup hosts file before writing, defaults to false */
	backup?: boolean;
	/** backup file path, defaults to /etc/hosts.bak */
	backupFile?: string;
};

const initialProps = {
	backup: false,
	backupFile: '/etc/hosts.bak',
	file: '/etc/hosts',
	sudo: false,
} satisfies Required<LinuxHostsProps> & ILinuxSudoOptions;

export class LinuxHosts extends AbstractLinuxHosts {
	public readonly name = 'LinuxHostsFile';
	public props: Required<LinuxHostsProps> & ILinuxSudoOptions;
	private logger?: ILoggerLike;

	constructor(props: LinuxHostsProps & ILinuxSudoOptions, logger?: ILoggerLike) {
		super();
		this.props = {...initialProps, ...props};
		this.logger = logger;
	}

	/**
	 * Add new entry to hosts, overriden to handle backup
	 * @param value - HostEntry
	 * @param index - optional index to insert entry at
	 * @returns promise that resolves to true if write was successful
	 */
	public override async add(value: HostEntry, index?: number): Promise<boolean> {
		return this.handleRestore(super.add(value, index));
	}

	/**
	 * Replace current hosts entry with new one, overriden to handle backup
	 * @param current - HostFileEntry
	 * @param replace - HostEntry
	 * @returns promise that resolves to true if write was successful
	 */
	public override async replace(current: HostFileEntry, replace: HostEntry): Promise<boolean> {
		return this.handleRestore(super.replace(current, replace));
	}

	public async status(): Promise<ServiceStatusObject> {
		const errors: IErrorLike[] = [];
		try {
			// check if we can access the file and have write access
			await access(this.props.file, fs.constants.W_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no hosts file ${this.props.file} found or write access denied`});
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
		const comment = value.comment ? ` # ${value.comment}` : '';
		return `${value.address} ${value.hostname} ${value.aliases.join(' ')}${comment}`;
	}

	protected fromOutput(value: string): HostEntry | undefined {
		if (isValidLine(value)) {
			return parseHostLine(value, this.logger);
		}
		return undefined;
	}

	protected async storeOutput(value: string[]): Promise<void> {
		if (this.props.backup) {
			await copyFile(this.props.file, this.props.backupFile, undefined, this.props);
		}
		return writeFile(this.props.file, Buffer.from(value.join('\n')), this.props);
	}

	protected async loadOutput(): Promise<string[]> {
		return (await readFile(this.props.file, this.props)).toString().split('\n');
	}

	protected async verifyWrite(value: HostEntry): Promise<boolean> {
		const currentLine = this.toOutput(value);
		return (await this.listRaw()).some((line) => line === currentLine);
	}

	/**
	 * if write fails and backup is enabled, restores backup file
	 * @param isWriteOk - promise that resolves to true if write was successful
	 * @returns promise that resolves to true if write was successful
	 */
	private async handleRestore(isWriteOk: Promise<boolean>): Promise<boolean> {
		const status = await isWriteOk;
		if (!status && this.props.backup) {
			this.logger?.warn(`Write failed, restoring backup file ${this.props.backupFile}`);
			await copyFile(this.props.backupFile, this.props.file, undefined, this.props);
			await unlink(this.props.backupFile, this.props);
		}
		return status;
	}
}
