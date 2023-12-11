import {HostEntry, HostFileEntry} from '../types/v1/hostEntry';
import {ApiServiceV1} from '../interfaces/service';
import {ICommonApiV1} from '../interfaces/v1/ICommonApiV1';
import {isIP} from 'net';
import {isValidHostname} from '../lib/hostLineParser';
import {ServiceStatusObject} from '../interfaces/ServiceStatus';

export abstract class AbstractLinuxHosts<Output = string> implements ICommonApiV1<HostEntry, HostFileEntry>, ApiServiceV1 {
	abstract name: string;
	public readonly version: 1;

	/**
	 * list all entries from hosts
	 */
	public async list(): Promise<HostFileEntry[]> {
		await this.assertOnline();
		return this.dataToFileEntry(await this.loadOutput());
	}

	/**
	 * delete entry from hosts
	 */
	public async delete(value: HostFileEntry): Promise<boolean> {
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
	 * add new entry to hosts
	 */
	public async add(value: HostEntry, index?: number): Promise<boolean> {
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
	 * replace current hosts entry with new one
	 */
	public async replace(current: HostFileEntry, replace: HostEntry): Promise<boolean> {
		await this.assertOnline();
		this.validateEntry(replace);
		const data = await this.loadOutput();
		const entry = data[current.line] ? this.fromOutput(data[current.line]) : undefined;
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

	/**
	 * list raw stored Output type data
	 */
	public listRaw(): Promise<Output[]> {
		return this.loadOutput();
	}

	private validateEntry(entry: HostEntry): void {
		if (!isIP(entry.address)) {
			throw new TypeError(`${this.name}: Invalid IP address value: ${entry.address}`);
		}
		if (!isValidHostname(entry.hostname)) {
			throw new TypeError(`${this.name}: Invalid hostname value: ${entry.hostname}`);
		}
		if (!entry.aliases.every(isValidHostname)) {
			throw new TypeError(`${this.name}: Invalid alias value in: ${JSON.stringify(entry.aliases)}`);
		}
	}

	private dataToFileEntry(data: Output[]): HostFileEntry[] {
		return data.reduce<HostFileEntry[]>((acc, line, index) => {
			const entry = this.fromOutput(line);
			if (entry) {
				acc.push({...entry, line: index});
			}
			return acc;
		}, []);
	}

	private isSameEntry(a: HostEntry, b: HostEntry | undefined) {
		if (!b) {
			return false;
		}
		return a.address === b.address && a.hostname === b.hostname;
	}

	private isSameEntryCallback(a: HostEntry): (b: HostEntry) => boolean {
		return (b: HostEntry) => {
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
	protected abstract toOutput(value: HostEntry): Output;
	protected abstract fromOutput(value: Output): HostEntry | undefined;
	protected abstract storeOutput(value: Output[]): Promise<void>;
	protected abstract loadOutput(): Promise<Output[]>;
	protected abstract verifyWrite(value: HostEntry): Promise<boolean>;
}
