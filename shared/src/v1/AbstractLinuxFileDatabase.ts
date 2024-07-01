import {type ApiServiceV1} from '../interfaces/service';
import {type ICommonApiV1} from '../interfaces/v1/ICommonApiV1';
import {type IFileBackupProps} from '../interfaces';
import {LogLevel, MapLogger, type ILoggerLike} from '@avanio/logger-like';
import {type ServiceStatusObject} from '../interfaces/ServiceStatus';

const defaultMapLogLevels = {
	list: LogLevel.None,
	delete: LogLevel.Debug,
	add: LogLevel.Debug,
	replace: LogLevel.Debug,
	store_output: LogLevel.Debug,
	load_output: LogLevel.None,
	create_backup: LogLevel.Debug,
	restore_backup: LogLevel.Debug,
} as const;

export type AbstractLinuxFileDatabaseLogLevels = typeof defaultMapLogLevels;

export type AbstractLinuxFileDatabaseProps<LogLevels extends AbstractLinuxFileDatabaseLogLevels = AbstractLinuxFileDatabaseLogLevels> = IFileBackupProps & {
	logger?: ILoggerLike;
} & {logLevels?: LogLevels};

const defaultBackupProps = {
	backup: false,
	logLevels: defaultMapLogLevels,
	logger: undefined,
} as const;

/**
 * Abstract class for file based Linux NSS databases
 * - uses line numbers as location identifier to help checking changes on file based data.
 */
export abstract class AbstractLinuxFileDatabase<
		Props extends AbstractLinuxFileDatabaseProps,
		Entry extends Record<string, unknown>,
		FileEntry extends Entry & {line: number},
		Output = string,
		LogLevels extends Exclude<Props['logLevels'], undefined> = Exclude<Props['logLevels'], undefined>,
	>
	implements ICommonApiV1<Entry, FileEntry>, ApiServiceV1
{
	abstract name: string;
	public readonly version = 1;
	protected readonly props: Readonly<Props>;
	protected logger: MapLogger<LogLevels>;

	constructor(props?: Partial<Props>) {
		this.props = Object.assign({}, defaultBackupProps, props) as Props;
		this.logger = new MapLogger(this.props.logger, {...defaultMapLogLevels, ...props?.logLevels});
	}

	public setLogger(logger: ILoggerLike): void {
		this.logger.setLogger(logger);
	}

	public setLogMapping(logLevels: Partial<LogLevels>): void {
		this.logger.setLogMapping(logLevels);
	}

	/**
	 * list all entries from hosts
	 */
	public async list(): Promise<FileEntry[]> {
		this.logger.logKey('list', `${this.name}: listing entries`);
		await this.assertOnline();
		return this.dataToFileEntry(await this.handleRead());
	}

	/**
	 * delete entry
	 */
	public async delete(value: FileEntry): Promise<boolean> {
		this.logger.logKey('delete', `${this.name}: deleting entry`);
		await this.assertOnline();
		const data = await this.handleRead();
		// read value from current data and check if it's same as value
		const currentLine = data[value.line];
		const entry = currentLine ? this.fromOutput(currentLine) : undefined;
		if (this.isSameEntry(value, entry)) {
			data.splice(value.line, 1);
			return this.handleWrite(data, value, true);
		}
		// if not, check if the value is still in the file but on a different line
		const lostEntry = this.dataToFileEntry(data).find(this.isSameEntryCallback(value));
		if (lostEntry && value.line !== lostEntry.line) {
			throw new Error(`${this.name}: might have been changed since the entry was read`);
		}
		return false;
	}

	/**
	 * add new entry
	 */
	public async add(value: Entry, index?: number): Promise<boolean> {
		this.logger.logKey('add', `${this.name}: adding entry`);
		await this.assertOnline();
		this.validateEntry(value);
		const lines = await this.handleRead();
		if (this.dataToFileEntry(lines).some(this.isSameEntryCallback(value))) {
			throw new Error(`${this.name}: Entry already exists`);
		}
		if (index === undefined || index > lines.length) {
			lines.push(this.toOutput(value));
		} else {
			lines.splice(index, 0, this.toOutput(value));
		}
		return this.handleWrite(lines, value);
	}

	/**
	 * replace current entry with new one
	 */
	public async replace(current: FileEntry, replace: Entry): Promise<boolean> {
		this.logger.logKey('replace', `${this.name}: replacing entry`);
		await this.assertOnline();
		this.validateEntry(replace);
		const data = await this.handleRead();
		const currentLine = data[current.line];
		const entry = currentLine ? this.fromOutput(currentLine) : undefined;
		if (this.isSameEntry(current, entry)) {
			data[current.line] = this.toOutput(replace);
			return this.handleWrite(data, replace);
		}
		// if not, check if the value is still in the file but on a different line
		const lostEntry = this.dataToFileEntry(data).find(this.isSameEntryCallback(current));
		if (lostEntry && current.line !== lostEntry.line) {
			throw new Error(`${this.name}: might have been changed since the entry was read`);
		}
		throw new Error(`${this.name}: Current entry does not exist`);
	}

	private dataToFileEntry(data: Output[]): FileEntry[] {
		return data.reduce<FileEntry[]>((acc, line, index) => {
			const entry = this.fromOutput(line);
			if (entry) {
				acc.push({...entry, line: index} as FileEntry);
			}
			return acc;
		}, []);
	}

	/**
	 * list raw stored Output type data
	 */
	public async listRaw(): Promise<Output[]> {
		return await this.handleRead();
	}

	/**
	 * Get number of entries.
	 *
	 * Override this default method if you have a more efficient way to count entries (like LDAP, krb5, etc.)
	 */
	public async count(): Promise<number> {
		await this.assertOnline();
		return (await this.list()).length;
	}

	/**
	 * Handle write operation
	 */
	private async handleWrite(data: Output[], value: FileEntry, isDelete: true): Promise<boolean>;
	private async handleWrite(data: Output[], value: Entry): Promise<boolean>;
	private async handleWrite(data: Output[], value: FileEntry, isDelete?: true): Promise<boolean> {
		if (this.props.backup) {
			this.logger.logKey('create_backup', `${this.name}: creating backup`);
			await this.createBackup();
		}
		this.logger.logKey('store_output', `${this.name}: storing output`);
		await this.storeOutput(data);
		if (value) {
			const isVerified = isDelete ? await this.verifyDelete(value) : await this.verifyWrite(value);
			if (!isVerified && this.props.backup) {
				this.logger.logKey('restore_backup', `${this.name}: restoring backup`);
				await this.restoreBackup();
			}
			return isVerified;
		}
		return true;
	}

	private handleRead(): Output[] | Promise<Output[]> {
		this.logger.logKey('load_output', `${this.name}: loading output`);
		return this.loadOutput();
	}

	private isSameEntryCallback(a: Entry | FileEntry): (b: Entry | FileEntry | undefined) => boolean {
		return (b: Entry | FileEntry | undefined) => {
			if (!b) {
				return false;
			}
			return this.isSameEntry(a, b);
		};
	}

	private async assertOnline(): Promise<void> {
		const res = await this.status();
		if (res.status !== 'online') {
			throw new Error(`${this.name} is not online: ${String(res.status)}`);
		}
	}

	public toJSON() {
		return {
			name: this.name,
			version: this.version,
			count: this.count(),
		};
	}

	/**
	 * validate entry object data before writing (add/replace)
	 * @throws Error if invalid
	 */
	protected abstract validateEntry(entry: Entry): void;
	protected abstract isSameEntry(a: Entry | FileEntry, b: Entry | FileEntry | undefined): boolean;
	public abstract status(): ServiceStatusObject | Promise<ServiceStatusObject>;
	protected abstract toOutput(value: Entry): Output;
	protected abstract fromOutput(value: Output): Entry | undefined;
	protected abstract storeOutput(value: Output[]): void | Promise<void>;
	protected abstract loadOutput(): Output[] | Promise<Output[]>;
	/** Verify if the write was successful and value can be found from data */
	protected abstract verifyWrite(value: Entry): boolean | Promise<boolean>;
	protected abstract verifyDelete(value: FileEntry): boolean | Promise<boolean>;
	protected abstract createBackup(): void | Promise<void>;
	protected abstract restoreBackup(): void | Promise<void>;
}
