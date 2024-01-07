import {AbstractLinuxFileDatabase, nssConfLineBuilder, NssEntry, NssFileEntry, parseNssConfLine, ServiceStatusObject, validateLinuxNssEntry} from '../../src';
import {ILoggerLike} from '@avanio/logger-like';

export function buildOutput(value: NssEntry): string {
	const data = nssConfLineBuilder(value);
	if (parseNssConfLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxNssConf extends AbstractLinuxFileDatabase<NssEntry, NssFileEntry> {
	public name = 'MockLinuxNssConf';
	private logger: ILoggerLike;
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

	constructor(logger: ILoggerLike) {
		super();
		this.logger = logger;
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

	protected verifyWrite(value: NssEntry): Promise<boolean> {
		return Promise.resolve(this._data.includes(this.toOutput(value)));
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
}
