import {AbstractLinuxFileDatabase, passwdLineBuilder, PasswordEntry, PasswordFileEntry, ServiceStatusObject, validateLinuxPasswordEntry} from '../../src';
import {ILoggerLike} from '@avanio/logger-like';
import {parsePasswdLine} from '../../src/lib/passwdLineParser';

export function buildOutput(value: PasswordEntry): string {
	const data = passwdLineBuilder(value);
	if (parsePasswdLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxPasswd extends AbstractLinuxFileDatabase<PasswordEntry, PasswordFileEntry> {
	public name = 'MockLinuxPasswd';
	private logger: ILoggerLike;
	private _state: ServiceStatusObject = {status: 'online'};
	private _data: string[] = [
		'# linux passwd file with comments',
		'root:x:0:0:root:/root:/bin/bash',
		'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
		'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
		'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
	];

	constructor(logger: ILoggerLike) {
		super();
		this.logger = logger;
	}

	public status(): Promise<ServiceStatusObject> {
		return Promise.resolve(this._state);
	}

	protected toOutput(value: PasswordEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): PasswordEntry | undefined {
		return parsePasswdLine(value, this.logger);
	}

	protected storeOutput(value: string[]): Promise<void> {
		this._data = [...value];
		return Promise.resolve();
	}

	protected loadOutput(): Promise<string[]> {
		return Promise.resolve([...this._data]);
	}

	protected verifyWrite(value: PasswordEntry): Promise<boolean> {
		return Promise.resolve(this._data.includes(this.toOutput(value)));
	}

	protected isSameEntry(a: PasswordEntry | PasswordFileEntry, b: PasswordEntry | PasswordFileEntry | undefined) {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected validateEntry(entry: PasswordEntry): void {
		validateLinuxPasswordEntry(entry);
	}
}
