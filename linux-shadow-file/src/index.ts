import * as fs from 'fs';
import {
	AbstractLinuxFileDatabase,
	type IErrorLike,
	type IFileBackupProps,
	isValidLine,
	parseShadowLine,
	type ServiceStatusObject,
	type ShadowEntry,
	type ShadowFileEntry,
	validateLinuxShadowEntry,
} from '@avanio/os-api-shared';
import {access, copyFile, type ILinuxSudoOptions, readFile, unlink, writeFile} from '@avanio/os-api-linux-utils';
import {type ILoggerLike} from '@avanio/logger-like';

function eStr(value: string | number | undefined): string {
	return value === undefined ? '' : value.toString();
}

type LinuxPasswdProps = {
	/** file path, defaults to /etc/passwd */
	file?: string;
} & Partial<IFileBackupProps>;

const initialProps = {
	backup: false,
	backupFile: '/etc/shadow.bak',
	file: '/etc/shadow',
	sudo: false,
} satisfies Required<LinuxPasswdProps> & ILinuxSudoOptions;

export class LinuxShadow extends AbstractLinuxFileDatabase<ShadowEntry, ShadowFileEntry> {
	public readonly name = 'LinuxShadowFile';
	public props: Required<LinuxPasswdProps> & ILinuxSudoOptions;
	private logger?: ILoggerLike;

	constructor(props: LinuxPasswdProps & ILinuxSudoOptions, logger?: ILoggerLike) {
		super();
		this.props = {...initialProps, ...props};
		this.logger = logger;
	}

	/**
	 * Add new entry, overriden to handle backup
	 * @param value - PasswordEntry
	 * @param index - optional index to insert entry at
	 * @returns promise that resolves to true if write was successful
	 */
	public override async add(value: ShadowEntry, index?: number): Promise<boolean> {
		return this.handleRestore(super.add(value, index));
	}

	/**
	 * Replace current entry with new one, overriden to handle backup
	 * @param current - PasswordFileEntry
	 * @param replace - PasswordEntry
	 * @returns promise that resolves to true if write was successful
	 */
	public override async replace(current: ShadowFileEntry, replace: ShadowEntry): Promise<boolean> {
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

	protected toOutput(value: ShadowEntry): string {
		// linux shadow line
		const data = `${value.username}:${value.password}:${value.changed.toString()}:${value.min.toString()}:${value.max.toString()}:${value.warn.toString()}:${eStr(value.inactive)}:${eStr(
			value.expire,
		)}:${eStr(value.reserved)}`;
		if (parseShadowLine(data) === undefined) {
			throw new Error(`Invalid output line: ${data}`);
		}
		return data;
	}

	protected fromOutput(value: string): ShadowEntry | undefined {
		if (isValidLine(value)) {
			return parseShadowLine(value, this.logger);
		}
		return undefined;
	}

	protected validateEntry(entry: ShadowEntry): void {
		validateLinuxShadowEntry(entry);
	}

	protected isSameEntry(a: ShadowEntry | ShadowFileEntry, b: ShadowEntry | ShadowFileEntry | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.username === b.username;
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

	protected async verifyWrite(value: ShadowEntry): Promise<boolean> {
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
