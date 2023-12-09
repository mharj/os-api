import {ShadowEntry, shadowEntrySchema, ShadowFileEntry} from '../types';
import {ApiServiceV1} from '../interfaces/service';
import {IShadowApiV1} from '../interfaces/v1/IShadowApiV1';
import {ServiceStatusObject} from '../interfaces/ServiceStatus';

export abstract class AbstractLinuxShadow<Output = string> implements IShadowApiV1, ApiServiceV1 {
	abstract name: string;
	public readonly version: 1;

	/**
	 * list all entries
	 */
	public async list(): Promise<ShadowFileEntry[]> {
		await this.assertOnline();
		return this.dataToFileEntry(await this.loadOutput());
	}

	/**
	 * delete entry
	 */
	public async delete(value: ShadowFileEntry): Promise<boolean> {
		await this.assertOnline();
		const data = await this.loadOutput();
		// read value from current data and check if it's same as value
		const entry = data[value.line] ? this.fromOutput(data[value.line]) : undefined;
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
	public async add(value: ShadowEntry, index?: number): Promise<boolean> {
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
		return true;
	}

	/**
	 * replace current entry with new one
	 */
	public async replace(current: ShadowFileEntry, replace: ShadowEntry): Promise<void> {
		await this.assertOnline();
		this.validateEntry(replace);
		const data = await this.loadOutput();
		const entry = data[current.line] ? this.fromOutput(data[current.line]) : undefined;
		if (this.isSameEntry(current, entry)) {
			data[current.line] = this.toOutput(replace);
			return this.storeOutput(data);
		}
		// if not, check if the value is still in the file but on a different line
		const lostEntry = this.dataToFileEntry(data).find(this.isSameEntryCallback(current));
		if (lostEntry && current.line !== lostEntry.line) {
			throw new Error(`${this.name}: might have been changed since the entry was read`);
		}
		throw new Error(`${this.name}: Current entry does not exist`);
	}

	private dataToFileEntry(data: Output[]): ShadowFileEntry[] {
		return data.reduce<ShadowFileEntry[]>((acc, line, index) => {
			const entry = this.fromOutput(line);
			if (entry) {
				acc.push({...entry, line: index});
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

	private validateEntry(entry: ShadowEntry): void {
		try {
			shadowEntrySchema.parse(entry);
		} catch (e) {
			throw new TypeError(`${this.name}: Invalid entry: ${JSON.stringify(entry)}`);
		}
	}

	private isSameEntry(a: ShadowEntry, b: ShadowEntry | undefined) {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	private isSameEntryCallback(a: ShadowEntry): (b: ShadowEntry) => boolean {
		return (b: ShadowEntry) => {
			return this.isSameEntry(a, b);
		};
	}

	private async assertOnline(): Promise<void> {
		const res = await this.status();
		if (res.status !== 'online') {
			throw new Error(`${this.name} is not online: ${res.status}`);
		}
	}

	public abstract status(): Promise<ServiceStatusObject>;
	protected abstract toOutput(value: ShadowEntry): Output;
	protected abstract fromOutput(value: Output): ShadowEntry | undefined;
	protected abstract storeOutput(value: Output[]): Promise<void>;
	protected abstract loadOutput(): Promise<Output[]>;
}
