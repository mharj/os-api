import * as fs from 'fs';
import {
	AbstractLinuxFileDatabase,
	type IErrorLike,
	type IFileBackupProps,
	isValidLine,
	parsePasswdLine,
	passwdLineBuilder,
	type PasswordEntry,
	type PasswordFileEntry,
	type ServiceStatusObject,
	validateLinuxPasswordEntry,
} from '@avanio/os-api-shared';
import {access, copyFile, type ILinuxSudoOptions, type IMakeDbProps, readMakeDbFile, writeMakeDbFile} from '@avanio/os-api-linux-utils';
import {type ILoggerLike} from '@avanio/logger-like';

type LinuxHostsDbProps = {
	/**
	 * NSS database file path
	 *
	 * @default '/var/lib/misc/hosts.db' as for Debian/Ubuntu based systems.
	 */
	file?: string;
} & Partial<IFileBackupProps> &
	IMakeDbProps;

const initialProps: Required<LinuxHostsDbProps> & ILinuxSudoOptions = {
	backup: false,
	backupFile: '/var/lib/misc/passwd.db.bak',
	file: '/var/lib/misc/passwd.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
};

export class LinuxPasswdDb extends AbstractLinuxFileDatabase<PasswordEntry, PasswordFileEntry> {
	public readonly name = 'LinuxPasswdDb';
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

	protected toOutput(value: PasswordEntry): string {
		return passwdLineBuilder(value);
	}

	protected fromOutput(value: string): PasswordEntry | undefined {
		if (isValidLine(value)) {
			return parsePasswdLine(value, this.logger);
		}
		return undefined;
	}

	protected async verifyWrite(value: PasswordEntry): Promise<boolean> {
		const line = this.toOutput(value);
		return (await this.listRaw()).some((v) => v === line);
	}

	protected validateEntry(entry: PasswordEntry): void {
		validateLinuxPasswordEntry(entry);
	}

	protected isSameEntry(a: PasswordEntry | PasswordFileEntry, b: PasswordEntry | PasswordFileEntry | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected async storeOutput(value: string[]): Promise<void> {
		if (this.props.backup) {
			this.logger?.debug(`${this.name}::backup`, this.props.backupFile);
			await copyFile(this.props.file, this.props.backupFile, undefined, this.props);
		}
		await writeMakeDbFile(this.props.file, Buffer.from(value.join('\n')), {...this.props, logger: this.logger});
	}

	protected async loadOutput(): Promise<string[]> {
		const data = await readMakeDbFile(this.props.file, {...this.props, logger: this.logger});
		return data
			.toString()
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.length > 0);
	}
}
