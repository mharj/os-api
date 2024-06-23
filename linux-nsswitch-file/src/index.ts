import * as fs from 'fs';
import {
	AbstractLinuxFileDatabase,
	type IErrorLike,
	type IFileBackupProps,
	isValidLine,
	nssConfLineBuilder,
	type NssEntry,
	nssEntrySchema,
	type NssFileEntry,
	parseNssConfLine,
	type ServiceStatusObject,
} from '@avanio/os-api-shared';
import {access, copyFile, type ILinuxSudoOptions, readFile, unlink, writeFile} from '@avanio/os-api-linux-utils';
import {type ILoggerLike} from '@avanio/logger-like';
import {type PathLike} from 'node:fs';

interface LinuxNssProps extends Partial<IFileBackupProps> {
	/** nsswitch file path, defaults to '/etc/nsswitch.conf' */
	file?: PathLike;
}

const initialProps = {
	backup: false,
	backupFile: '/etc/nsswitch.conf.bak',
	file: '/etc/nsswitch.conf',
	sudo: false,
} satisfies Required<LinuxNssProps> & ILinuxSudoOptions;

export class LinuxNssFile extends AbstractLinuxFileDatabase<NssEntry, NssFileEntry> {
	public readonly name = 'LinuxNssFile';
	public props: Required<LinuxNssProps> & ILinuxSudoOptions;
	private logger?: ILoggerLike;

	constructor(props: LinuxNssProps & ILinuxSudoOptions, logger?: ILoggerLike) {
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
	public override async add(value: NssEntry, index?: number): Promise<boolean> {
		return this.handleRestore(super.add(value, index));
	}

	/**
	 * Replace current hosts entry with new one, overriden to handle backup
	 * @param current - HostFileEntry
	 * @param replace - HostEntry
	 * @returns promise that resolves to true if write was successful
	 */
	public override async replace(current: NssFileEntry, replace: NssEntry): Promise<boolean> {
		return this.handleRestore(super.replace(current, replace));
	}

	public async status(): Promise<ServiceStatusObject> {
		const errors: IErrorLike[] = [];
		try {
			// check if we can access the file and have write access
			await access(this.props.file, fs.constants.W_OK, this.props);
		} catch (e) {
			errors.push({name: 'FileError', message: `no name service switch file ${String(this.props.file)} found or write access denied`});
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

	protected toOutput(value: NssEntry): string {
		return nssConfLineBuilder(value);
	}

	protected fromOutput(value: string): NssEntry | undefined {
		if (isValidLine(value)) {
			return parseNssConfLine(value, this.logger);
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

	protected async verifyWrite(value: NssEntry): Promise<boolean> {
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

	public validateEntry(value: NssEntry): boolean {
		return nssEntrySchema.safeParse(value).success;
	}

	public isSameEntry(a: NssEntry | NssFileEntry, b: NssEntry | NssFileEntry | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.database === b.database;
	}
}
