import * as fs from 'fs';
import {
	AbstractLinuxFileDatabase,
	type AbstractLinuxFileDatabaseProps,
	type HostEntry,
	type HostFileEntry,
	type IErrorLike,
	type IFileBackupProps,
	isValidLine,
	parseHostLine,
	type ServiceStatusObject,
	validateLinuxHostsEntry,
} from '@avanio/os-api-shared';
import {access, chmod, copyFile, type ILinuxSudoOptions, readMakeDbFile, writeMakeDbFile} from '@avanio/os-api-linux-utils';

type LinuxHostsDbProps = Partial<IFileBackupProps> &
	ILinuxSudoOptions & {
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

const initialProps = {
	backup: false,
	backupFile: '/var/lib/misc/hosts.db.bak',
	file: '/var/lib/misc/hosts.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
} satisfies LinuxHostsDbProps;

export class LinuxHostsDb extends AbstractLinuxFileDatabase<Required<LinuxHostsDbProps> & AbstractLinuxFileDatabaseProps, HostEntry, HostFileEntry> {
	public readonly name = 'LinuxHostsDb';
	constructor(props: LinuxHostsDbProps & ILinuxSudoOptions & Partial<AbstractLinuxFileDatabaseProps> = {}) {
		super(Object.assign({}, initialProps, props));
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

	protected async verifyDelete(value: HostEntry): Promise<boolean> {
		const line = this.toOutput(value);
		return !(await this.listRaw()).some((v) => v === line);
	}

	protected async storeOutput(value: string[]): Promise<void> {
		await writeMakeDbFile(this.props.file, Buffer.from(value.join('\n')), this.props);
	}

	protected async loadOutput(): Promise<string[]> {
		const data = await readMakeDbFile(this.props.file, this.props);
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

	protected async createBackup(): Promise<void> {
		await copyFile(this.props.file, this.props.backupFile, undefined, this.props);
		if (this.props.backupPermissions.posixMode) {
			// clone permissions from the original file
			await chmod(this.props.backupFile, this.modeAsOctal(this.props.backupPermissions.posixMode), this.props);
		}
	}

	protected async restoreBackup(): Promise<void> {
		await copyFile(this.props.backupFile, this.props.file, undefined, this.props);
		if (this.props.backupPermissions.posixMode) {
			// clone permissions from the original file
			await chmod(this.props.file, this.modeAsOctal(this.props.backupPermissions.posixMode), this.props);
		}
	}

	private modeAsOctal(octal: number): number {
		return Number(octal) & 0o777;
	}
}
