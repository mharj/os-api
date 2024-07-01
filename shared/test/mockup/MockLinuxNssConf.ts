import {
	AbstractLinuxFileDatabase,
	AbstractLinuxFileDatabaseProps,
	nssConfLineBuilder,
	type NssEntry,
	type NssFileEntry,
	parseNssConfLine,
	type ServiceStatusObject,
	validateLinuxNssEntry,
} from '../../src';
import {type ILoggerLike} from '@avanio/logger-like';

export function buildOutput(value: NssEntry): string {
	const data = nssConfLineBuilder(value);
	if (parseNssConfLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxNssConf extends AbstractLinuxFileDatabase<AbstractLinuxFileDatabaseProps, NssEntry, NssFileEntry> {
	public name = 'MockLinuxNssConf';
	private _state: ServiceStatusObject = {status: 'online'};
	private _data: string[] = [
		'# /etc/nsswitch.conf',
		'#',
		'# Example configuration of GNU Name Service Switch functionality.',
		'# If you have the glibc-doc-reference and info packages installed, try:',
		'# info libc "Name Service Switch" for information about this file.',
		'',
		'passwd:         files',
		'group:          files',
		'shadow:         files',
		'gshadow:        files',
		'',
		'hosts:          files dns',
		'networks:       files',
		'',
		'protocols:      db files',
		'services:       db files',
		'ethers:         db files',
		'rpc:            db files',
		'',
		'netgroup:       nis',
	];

	private _backup: string[] = [];

	constructor(logger: ILoggerLike) {
		super({logger});
	}

	public status(): Promise<ServiceStatusObject> {
		return Promise.resolve(this._state);
	}

	protected toOutput(value: NssEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): NssEntry | undefined {
		return parseNssConfLine(value, this.logger);
	}

	protected storeOutput(value: string[]): Promise<void> {
		this._data = [...value];
		return Promise.resolve();
	}

	protected loadOutput(): Promise<string[]> {
		return Promise.resolve([...this._data]);
	}

	protected isSameEntry(a: NssEntry | NssFileEntry, b: NssEntry | NssFileEntry | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.database === b.database;
	}

	protected validateEntry(entry: NssEntry): void {
		validateLinuxNssEntry(entry);
	}

	protected verifyWrite(value: NssEntry) {
		return this._data.includes(this.toOutput(value));
	}

	protected verifyDelete(value: NssFileEntry) {
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
