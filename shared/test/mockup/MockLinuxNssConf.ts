import {nssConfLineBuilder, NssEntry, parseNssConfLine, ServiceStatusObject} from '../../src';
import {AbstractLinuxNss} from '../../src/v1/AbstractLinuxNss';
import {ILoggerLike} from '@avanio/logger-like';

export function buildOutput(value: NssEntry): string {
	const data = nssConfLineBuilder(value);
	if (parseNssConfLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxNssConf extends AbstractLinuxNss {
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
}
