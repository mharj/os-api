import * as fs from 'fs';
import {
	AbstractLinuxFileDatabase,
	type AbstractLinuxFileDatabaseProps,
	type ApiServiceV1,
	type BaseEntry,
	type DistinctKey,
	type ICommonApiV1,
	type IErrorLike,
	type IFileBackupProps,
	type RawDataMap,
	type ServiceStatusObject,
} from '@avanio/os-api-shared';
import {access, chmod, copyFile, type ILinuxSudoOptions, readMakeDbFile, test, unlink, writeMakeDbFile} from '@avanio/os-api-linux-utils';
import {type DotKey, parseDotKey} from './dotKey';
import {type EqualKey, parseEqualKey} from './equalKey';
import {parseIndexKey} from './indexKey';

export type MakeDbKey = EqualKey | DotKey | number;

export const parsePrimaryKey = /^\d+$/;

export type AbstractMakeDbDatabaseProps = AbstractLinuxFileDatabaseProps &
	ILinuxSudoOptions &
	IFileBackupProps & {
		file: string;
		makedb: string;
	};

export abstract class AbstractMakeDbDatabase<Props extends AbstractMakeDbDatabaseProps, Entry extends BaseEntry>
	extends AbstractLinuxFileDatabase<Props, Entry, MakeDbKey>
	implements ICommonApiV1<Entry, DistinctKey<Entry, MakeDbKey>>, ApiServiceV1
{
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

	protected async storeOutput(value: RawDataMap<MakeDbKey, string>): Promise<void> {
		this.logger.debug(`write database to ${this.props.file}`);
		await writeMakeDbFile(this.props.file, this.rebuildDbData(value), this.props);
	}

	protected async loadOutput(): Promise<RawDataMap<MakeDbKey, string>> {
		this.logger.debug(`read database from ${this.props.file}`);
		const data = (await readMakeDbFile(this.props.file, this.props))
			.toString()
			.trim()
			.split('\n')
			.map((l) => l.trim());
		return this.indexCounterParser(data);
	}

	public override async createDatabase(): Promise<boolean> {
		if (await test(this.props.file, fs.constants.F_OK, this.props)) {
			return false;
		}
		this.logger.debug(`creating database to ${this.props.file}`);
		await writeMakeDbFile(this.props.file, Buffer.from(''), this.props);
		return true;
	}

	public override async deleteDatabase(): Promise<boolean> {
		if (await test(this.props.file, fs.constants.F_OK, this.props)) {
			this.logger.debug(`deleting database from ${this.props.file}`);
			await unlink(this.props.file, this.props);
			return true;
		}
		return false;
	}

	protected async createBackup(): Promise<void> {
		if (this.props.backupFile) {
			await copyFile(this.props.file, this.props.backupFile, undefined, this.props);
			this.logger.debug(`backup created to ${this.props.backupFile}`);
			if (this.props.backupPermissions?.posixMode) {
				// clone permissions from the original file
				await chmod(this.props.backupFile, this.modeAsOctal(this.props.backupPermissions.posixMode), this.props);
			}
		}
	}

	protected async restoreBackup(): Promise<void> {
		if (this.props.backupFile) {
			await copyFile(this.props.backupFile, this.props.file, undefined, this.props);
			if (this.props.backupPermissions?.posixMode) {
				// clone permissions from the original file
				await chmod(this.props.file, this.modeAsOctal(this.props.backupPermissions.posixMode), this.props);
			}
		}
	}

	private modeAsOctal(octal: number): number {
		return Number(octal) & 0o777;
	}

	protected rebuildDbData(value: RawDataMap<MakeDbKey, string>): Buffer {
		const output = Array.from(value.entries()).map(([key, value]) => `${key} ${value}`);
		return Buffer.from(output.join('\n'));
	}

	private indexCounterParser(values: string[]): Map<MakeDbKey, string> {
		const output = values.reduce<Map<MakeDbKey, string>>((acc, v) => {
			if (v.startsWith('.')) {
				const match = parseDotKey(v);
				if (match) {
					acc.set(match[0], match[1]);
				}
			} else if (v.startsWith('=')) {
				const match = parseEqualKey(v);
				if (match) {
					acc.set(match[0], match[1]);
				}
			} else if (v.match(/^\d+/)) {
				const match = parseIndexKey(v);
				if (match) {
					acc.set(match[0], match[1]);
				}
			}
			return acc;
		}, new Map());
		if (values.length !== output.size) {
			throw new Error(`indexCounterParser: ${values.length} to ${output.size}`);
		}
		return output;
	}

	protected getPrimaryIndexKey(data: RawDataMap<MakeDbKey, string>, dn: string | number | undefined): number {
		return this.getNumbericPrimaryDn(dn) || this.getLastIndexNumber(data) + 1;
	}

	protected override isSameKey(a: string | number, b: string | number): boolean {
		return a === b;
	}

	protected async verifyWrite(value: DistinctKey<Entry, MakeDbKey>): Promise<boolean> {
		const line = this.toOutput(value);
		this.logger.debug(`verifying write for ${line}`);
		const list = await this.listRaw();
		const foundCount = Array.from(list.entries()).reduce<number>((acc, [key, rawValue]) => {
			if (typeof key === 'number' && rawValue === line) {
				acc++;
			}
			return acc;
		}, 0);
		if (foundCount > 1) {
			throw new Error(`verifyWrite: ${foundCount} found for ${line}`);
		}
		return foundCount === 1;
	}

	protected async verifyDelete(value: DistinctKey<Entry, MakeDbKey>): Promise<boolean> {
		const line = this.toOutput(value);
		this.logger.debug(`verifying delete for ${line}`);
		const list = await this.listRaw();
		const foundCount = Array.from(list.entries()).reduce<number>((acc, [key, rawValue]) => {
			if (typeof key === 'number' && rawValue === line) {
				acc++;
			}
			return acc;
		}, 0);
		this.logger.debug(`verifying delete for ${line}`, foundCount === 0);
		return foundCount === 0;
	}

	private getLastIndexNumber(data: RawDataMap<MakeDbKey, string>): number {
		return Array.from(data.keys()).reduce<number>((acc, v) => {
			if (typeof v === 'number' && v > acc) {
				acc = v;
			}
			return acc;
		}, 0);
	}

	private getNumbericPrimaryDn(dn: string | number | undefined): number | undefined {
		if (typeof dn === 'number') {
			return dn;
		}
		return dn ? parseInt(dn, 10) : undefined;
	}

	protected getEntryKeyAsString(key: MakeDbKey): string {
		return key.toString();
	}

	protected override getEntryRawValueAsString(value: string): string {
		return value;
	}

	/* protected abstract override validateEntry(entry: Entry): void;
	protected abstract override isSameEntry(a: Entry | DistinctKey<Entry, string>, b: Entry | DistinctKey<Entry, string> | undefined): boolean;
	protected abstract override toOutput(value: Entry): string;
	protected abstract override fromOutput(value: string, dn: string | number): Entry | undefined; */
}
