import {
	AbstractLinuxFileDatabase,
	AbstractLinuxFileDatabaseProps,
	type HostEntry,
	type HostFileEntry,
	hostLineBuilder,
	isValidLine,
	parseHostLine,
	type ServiceStatusObject,
	validateLinuxHostsEntry,
} from '../../src/';
import type {ILoggerLike} from '@avanio/logger-like';

export function buildOutput(value: HostEntry): string {
	const data = hostLineBuilder(value);
	if (parseHostLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxHosts extends AbstractLinuxFileDatabase<AbstractLinuxFileDatabaseProps, HostEntry, HostFileEntry> {
	public name = 'MockLinuxHosts';
	private _state: ServiceStatusObject = {status: 'online'};
	private _data: string[] = [
		'127.0.0.1       localhost',
		'',
		'# The following lines are desirable for IPv6 capable hosts',
		'::1     ip6-localhost ip6-loopback',
	];

	private _backup: string[] = [];

	constructor(logger: ILoggerLike) {
		super({logger});
	}

	public setState(state: ServiceStatusObject) {
		this._state = state;
	}

	public status(): Promise<ServiceStatusObject> {
		return Promise.resolve(this._state);
	}

	protected toOutput(value: HostEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): HostEntry | undefined {
		if (isValidLine(value)) {
			return parseHostLine(value, this.logger);
		}
		return undefined;
	}

	protected storeOutput(value: string[]): Promise<void> {
		this._data = [...value];
		return Promise.resolve();
	}

	protected loadOutput(): Promise<string[]> {
		return Promise.resolve([...this._data]);
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

	protected verifyWrite(value: HostEntry) {
		return this._data.includes(this.toOutput(value));
	}

	protected verifyDelete(value: HostFileEntry) {
		return !this._data.some((line) => {
			const entry = this.fromOutput(line);
			if (!entry) {
				return false;
			}
			return this.isSameEntry(entry, value);
		});
	}

	protected createBackup(): void | Promise<void> {
		this._backup = [...this._data];
	}

	protected restoreBackup(): void | Promise<void> {
		this._data = [...this._backup];
	}
}
