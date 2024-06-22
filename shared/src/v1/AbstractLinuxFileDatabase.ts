import {ApiServiceV1} from '../interfaces/service';
import {ICommonApiV1} from '../interfaces/v1/ICommonApiV1';
import {ServiceStatusObject} from '../interfaces/ServiceStatus';

/**
 * Abstract class for file based Linux NSS databases
 * - uses line numbers as location identifier to help checking changes on file based data.
 */
export abstract class AbstractLinuxFileDatabase<Entry extends Record<string, unknown>, FileEntry extends Entry & {line: number}, Output = string>
	implements ICommonApiV1<Entry, FileEntry>, ApiServiceV1
{
	abstract name: string;
	public readonly version = 1;

	/**
	 * list all entries from hosts
	 */
	public async list(): Promise<FileEntry[]> {
		await this.assertOnline();
		return this.dataToFileEntry(await this.loadOutput());
	}

	/**
	 * delete entry
	 */
	public async delete(value: FileEntry): Promise<boolean> {
		await this.assertOnline();
		const data = await this.loadOutput();
		// read value from current data and check if it's same as value
		const currentLine = data[value.line];
		const entry = currentLine ? this.fromOutput(currentLine) : undefined;
		if (this.isSameEntry(value, entry)) {
			data.splice(value.line, 1);
			await this.storeOutput(data);
			return true;
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
		await this.assertOnline();
		this.validateEntry(value);
		const lines = await this.loadOutput();
		if (this.dataToFileEntry(lines).some(this.isSameEntryCallback(value))) {
			throw new Error(`${this.name}: Entry already exists`);
		}
		if (index === undefined || index > lines.length) {
			lines.push(this.toOutput(value));
		} else {
			lines.splice(index, 0, this.toOutput(value));
		}
		await this.storeOutput(lines);
		return this.verifyWrite(value);
	}

	/**
	 * replace current entry with new one
	 */
	public async replace(current: FileEntry, replace: Entry): Promise<boolean> {
		await this.assertOnline();
		this.validateEntry(replace);
		const data = await this.loadOutput();
		const currentLine = data[current.line];
		const entry = currentLine ? this.fromOutput(currentLine) : undefined;
		if (this.isSameEntry(current, entry)) {
			data[current.line] = this.toOutput(replace);
			await this.storeOutput(data);
			return this.verifyWrite(replace);
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
	public listRaw(): Promise<Output[]> {
		return this.loadOutput();
	}

	/**
	 * Get number of entries.
	 *
	 * Override this default method if you have a more efficient way to count entries (like LDAP, krb5, etc.)
	 */
	public async count(): Promise<number> {
		await this.assertOnline();
		return (await this.listRaw()).length;
	}

	private isSameEntryCallback(a: Entry | FileEntry): (b: Entry | FileEntry) => boolean {
		return (b: Entry | FileEntry) => {
			if (!b) {
				return false;
			}
			return this.isSameEntry(a, b);
		};
	}

	private async assertOnline(): Promise<void> {
		const res = await this.status();
		if (res.status !== 'online') {
			throw new Error(`${this.name} is not online: ${res.status}`);
		}
	}

	/**
	 * validate entry object data before writing (add/replace)
	 * @throws Error if invalid
	 */
	protected abstract validateEntry(entry: Entry): void;
	protected abstract isSameEntry(a: Entry | FileEntry, b: Entry | FileEntry | undefined): boolean;
	public abstract status(): Promise<ServiceStatusObject>;
	protected abstract toOutput(value: Entry): Output;
	protected abstract fromOutput(value: Output): Entry | undefined;
	protected abstract storeOutput(value: Output[]): Promise<void>;
	protected abstract loadOutput(): Promise<Output[]>;
	protected abstract verifyWrite(value: Entry): Promise<boolean>;
}
