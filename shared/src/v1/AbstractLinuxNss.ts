import {NssEntry, NssFileEntry, validateLinuxNssEntry} from '../types/v1/nsSwitchEntry';
import {ApiServiceV1} from '../interfaces/service';
import {ICommonApiV1} from '../interfaces/v1/ICommonApiV1';
import {ServiceStatusObject} from '../interfaces/ServiceStatus';

export abstract class AbstractLinuxNss<Output = string> implements ICommonApiV1<NssEntry, NssFileEntry>, ApiServiceV1 {
	abstract name: string;
	public readonly version = 1;

	/**
	 * list all entries
	 */
	public async list(): Promise<NssFileEntry[]> {
		await this.assertOnline();
		return this.dataToFileEntry(await this.loadOutput());
	}

	/**
	 * delete entry
	 */
	public async delete(value: NssFileEntry): Promise<boolean> {
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
	 * add new entry to hosts
	 */
	public async add(value: NssEntry, index?: number): Promise<boolean> {
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
	public async replace(current: NssFileEntry, replace: NssEntry): Promise<boolean> {
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

	private dataToFileEntry(data: Output[]): NssFileEntry[] {
		return data.reduce<NssFileEntry[]>((acc, line, index) => {
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

	private validateEntry(entry: NssEntry): void {
		validateLinuxNssEntry(entry);
	}

	private isSameEntry(a: NssEntry, b: NssEntry | undefined) {
		if (!b) {
			return false;
		}
		return a.database === b.database;
	}

	private isSameEntryCallback(a: NssEntry): (b: NssEntry) => boolean {
		return (b: NssEntry) => {
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
	protected abstract toOutput(value: NssEntry): Output;
	protected abstract fromOutput(value: Output): NssEntry | undefined;
	protected abstract storeOutput(value: Output[]): Promise<void>;
	protected abstract loadOutput(): Promise<Output[]>;
	protected abstract verifyWrite(value: NssEntry): Promise<boolean>;
}
