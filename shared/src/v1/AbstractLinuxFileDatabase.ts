import {type BackupPermission, type IFileBackupProps} from '../interfaces';
import {type BaseEntry, type DistinctKey} from '../types/v1/baseEntry';
import {type ILoggerLike, LogLevel, LogLevelValue, MapLogger} from '@avanio/logger-like';
import {type ApiServiceV1} from '../interfaces/service';
import {type ICommonApiV1} from '../interfaces/v1/ICommonApiV1';
import {type ServiceStatusObject} from '../interfaces/ServiceStatus';

const defaultMapLogLevels = {
	add: LogLevel.Debug,
	create_backup: LogLevel.Debug,
	delete: LogLevel.Debug,
	entries: LogLevel.None,
	list: LogLevel.None,
	load_output: LogLevel.None,
	replace: LogLevel.Debug,
	restore_backup: LogLevel.Debug,
	store_output: LogLevel.Debug,
} as const;

export type RawDataMap<Key, Output> = Map<Key, Output>;

export type EntryDataMap<Key, Entry> = Map<Key, Entry>;

export type GetDnKeysOptions<Key, Entry> = {
	value: Entry;
	data: RawDataMap<Key, Entry>;
	dn?: Key;
};

export type AbstractLinuxFileDatabaseLogLevels = typeof defaultMapLogLevels;

export type AbstractLinuxFileDatabaseProps<
	LogLevels extends AbstractLinuxFileDatabaseLogLevels = AbstractLinuxFileDatabaseLogLevels,
	Permission extends BackupPermission = BackupPermission,
> = IFileBackupProps<Permission> & {
	logger?: ILoggerLike;
} & {logLevels?: LogLevels};

type InferLogLevels<T extends AbstractLinuxFileDatabaseProps> = Exclude<T['logLevels'], undefined>;

const defaultBackupProps = {
	backup: false,
	logLevels: defaultMapLogLevels,
	logger: undefined,
} as const;

/**
 * Abstract class for file based Linux NSS databases
 * - uses line numbers as location identifier to help checking changes on file based data.
 */
export abstract class AbstractLinuxFileDatabase<Props extends AbstractLinuxFileDatabaseProps, Entry extends BaseEntry, EntryKey, Output = string>
	implements ICommonApiV1<Entry, DistinctKey<Entry, EntryKey>>, ApiServiceV1
{
	abstract name: string;
	public readonly version = 1;
	protected readonly props: Readonly<Props>;
	protected logger: MapLogger<InferLogLevels<Props>>;

	constructor(props?: Partial<Props>) {
		this.props = Object.assign({}, defaultBackupProps, props) as Props;
		this.logger = new MapLogger(this.props.logger, {...defaultMapLogLevels, ...props?.logLevels});
	}

	public setLogger(logger: ILoggerLike): void {
		this.logger.setLogger(logger);
	}

	public setLogMapping(logLevels: Partial<InferLogLevels<Props>>): void {
		this.logger.setLogMapping(logLevels);
	}

	public allLogMapSet(level: LogLevelValue) {
		this.logger.allLogMapSet(level);
	}

	public allLogMapReset() {
		this.logger.allLogMapReset();
	}

	/**
	 * list all entries from hosts
	 */
	public async list(): Promise<DistinctKey<Entry, EntryKey>[]> {
		this.logger.logKey('list', `${this.name}: listing entries`);
		await this.assertOnline();
		return this.dataToFileEntry(await this.handleRead());
	}

	/**
	 * List all entries from database with line numbers as key
	 */
	public async entries(): Promise<EntryDataMap<EntryKey, Entry>> {
		this.logger.logKey('entries', `${this.name}: listing entries`);
		await this.assertOnline();
		return Array.from((await this.handleRead()).entries()).reduce<EntryDataMap<EntryKey, Entry>>((acc, [index, line]) => {
			const entry = this.fromOutput(line, index);
			if (entry) {
				acc.set(index, entry);
			}
			return acc;
		}, new Map());
	}

	private handleNoKeyError(value: DistinctKey<Entry, EntryKey>, data: RawDataMap<EntryKey, Output>): Error {
		const lostEntry = this.dataToFileEntry(data).find(this.isSameEntryCallback(value));
		if (lostEntry) {
			return new Error(`${this.name}: might have been changed since the entry was read`);
		}
		return new Error(`${this.name}: Current entry does not exist`);
	}

	/**
	 * add new entry
	 */
	public async add(value: Entry, dn?: EntryKey): Promise<boolean> {
		this.logger.logKey('add', `${this.name}: adding entry`);
		await this.assertOnline();
		this.validateEntry(value);
		const data = await this.handleRead();
		if (this.dataToFileEntry(data).some(this.isSameEntryCallback(value))) {
			throw new Error(`${this.name}: Entry already exists`);
		}
		const writeValue = this.toOutput(value);
		for (const dnKey of this.getDnKeys({value, data, dn})) {
			data.set(dnKey, writeValue);
		}
		return this.handleWrite(data, value);
	}

	/**
	 * replace current entry with new one
	 */
	public async replace(orgEntry: DistinctKey<Entry, EntryKey>, value: Entry): Promise<boolean> {
		this.logger.logKey('replace', `${this.name}: replacing entry`);
		await this.assertOnline();
		this.validateEntry(value);
		const data = await this.handleRead();
		const currentKey = Array.from(data.keys()).find(this.isSameKeyCallback(orgEntry._idx));
		if (currentKey === undefined) {
			throw this.handleNoKeyError(orgEntry, data);
		}
		const writeValue = this.toOutput(value);
		for (const dnKey of this.getDnKeys({value, data, dn: currentKey})) {
			data.set(dnKey, writeValue);
		}
		return this.handleWrite(data, value);
	}

	/**
	 * delete entry
	 */
	public async delete(value: DistinctKey<Entry, EntryKey>): Promise<boolean> {
		this.logger.logKey('delete', `${this.name}: deleting entry`);
		await this.assertOnline();
		const data = await this.handleRead();
		const currentKey = Array.from(data.keys()).find(this.isSameKeyCallback(value._idx));
		if (currentKey === undefined) {
			throw this.handleNoKeyError(value, data);
		}
		for (const dnKey of this.getDnKeys({value, data, dn: currentKey})) {
			data.delete(dnKey);
		}
		return this.handleWrite(data, value, true);
	}

	private dataToFileEntry(data: RawDataMap<EntryKey, Output>): DistinctKey<Entry, EntryKey>[] {
		return Array.from(data.entries()).reduce<DistinctKey<Entry, EntryKey>[]>((acc, [dn, line]) => {
			const entry = this.fromOutput(line, dn);
			if (entry) {
				acc.push({...entry, _idx: dn});
			}
			return acc;
		}, []);
	}

	/**
	 * list raw stored Output type data
	 */
	public listRaw(): RawDataMap<EntryKey, Output> | Promise<RawDataMap<EntryKey, Output>> {
		return this.handleRead();
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
	private async handleWrite(data: RawDataMap<EntryKey, Output>, value: DistinctKey<Entry, EntryKey>, isDelete: true): Promise<boolean>;
	private async handleWrite(data: RawDataMap<EntryKey, Output>, value: Entry): Promise<boolean>;
	private async handleWrite(data: RawDataMap<EntryKey, Output>, value: DistinctKey<Entry, EntryKey>, isDelete?: true): Promise<boolean> {
		if (this.props.backup) {
			this.logger.logKey('create_backup', `${this.name}: creating backup`);
			await this.createBackup();
		}
		this.logger.logKey('store_output', `${this.name}: storing output`);
		await this.storeOutput(data);
		const isVerified = isDelete ? await this.verifyDelete(value) : await this.verifyWrite(value);
		if (!isVerified && this.props.backup) {
			this.logger.logKey('restore_backup', `${this.name}: restoring backup`);
			await this.restoreBackup();
		}
		return isVerified;
	}

	private handleRead(): RawDataMap<EntryKey, Output> | Promise<RawDataMap<EntryKey, Output>> {
		this.logger.logKey('load_output', `${this.name}: loading output`);
		return this.loadOutput();
	}

	private isSameEntryCallback(a: Entry | DistinctKey<Entry, EntryKey>): (b: Entry | DistinctKey<Entry, EntryKey> | undefined) => boolean {
		return (b: Entry | DistinctKey<Entry, EntryKey> | undefined) => {
			if (!b) {
				return false;
			}
			return this.isSameEntry(a, b);
		};
	}

	private isSameKeyCallback(a: EntryKey): (b: EntryKey) => boolean {
		return (b: EntryKey) => this.isSameKey(a, b);
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
	 * Create the database, default is no-op (override to implement)
	 * @returns true if successful
	 * @example
	 * public override async createDatabase(): Promise<boolean> {}
	 */
	public createDatabase(): Promise<boolean> {
		return Promise.resolve(false);
	}

	/**
	 * Delete the database, default is no-op (override to implement)
	 * @returns true if successful
	 * @example
	 * public override async deleteDatabase(): Promise<boolean> {}
	 */
	public deleteDatabase(): Promise<boolean> {
		return Promise.resolve(false);
	}

	/**
	 * validate entry object data before writing (add/replace)
	 * @throws Error if invalid
	 */
	protected abstract validateEntry(entry: Entry): void;
	protected abstract isSameEntry(a: Entry | DistinctKey<Entry, EntryKey>, b: Entry | DistinctKey<Entry, EntryKey> | undefined): boolean;
	protected abstract isSameKey(a: EntryKey, b: EntryKey): boolean;
	public abstract status(): ServiceStatusObject | Promise<ServiceStatusObject>;
	protected abstract toOutput(value: Entry): Output;
	protected abstract fromOutput(value: Output, dn: EntryKey): Entry | undefined;
	protected abstract storeOutput(value: RawDataMap<EntryKey, Output>): void | Promise<void>;
	protected abstract loadOutput(): RawDataMap<EntryKey, Output> | Promise<RawDataMap<EntryKey, Output>>;
	/** Verify if the write was successful and value can be found from data */
	protected abstract verifyWrite(value: Entry): boolean | Promise<boolean>;
	protected abstract verifyDelete(value: DistinctKey<Entry, EntryKey>): boolean | Promise<boolean>;
	protected abstract createBackup(): void | Promise<void>;
	protected abstract restoreBackup(): void | Promise<void>;
	protected abstract getDnKeys(dnOptions: {value: Entry; data: RawDataMap<EntryKey, Output>; dn?: EntryKey}): EntryKey[];
}
