import {
	AbstractLinuxFileDatabase,
	type AbstractLinuxFileDatabaseProps,
	passwdLineBuilder,
	type PasswordEntry,
	type PasswordFileEntry,
	type ServiceStatusObject,
	validateLinuxPasswordEntry,
} from '../../src';
import {type ILoggerLike} from '@avanio/logger-like';
import {parsePasswdLine} from '../../src/lib/passwdLineParser';

export function buildOutput(value: PasswordEntry): string {
	const data = passwdLineBuilder(value);
	if (parsePasswdLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxPasswd extends AbstractLinuxFileDatabase<AbstractLinuxFileDatabaseProps, PasswordEntry> {
	public name = 'MockLinuxPasswd';
	private _state: ServiceStatusObject = {status: 'online'};
	private _data: string[] = [
		'# linux passwd file with comments',
		'root:x:0:0:root:/root:/bin/bash',
		'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
		'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
		'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
	];

	private _backup: string[] = [];

	constructor(logger: ILoggerLike) {
		super({logger});
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

	protected validateEntry(entry: PasswordEntry): void {
		validateLinuxPasswordEntry(entry);
	}

	protected isSameEntry(a: PasswordEntry | PasswordFileEntry, b: PasswordEntry | PasswordFileEntry | undefined) {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected verifyWrite(value: PasswordEntry) {
		return this._data.includes(this.toOutput(value));
	}

	protected verifyDelete(value: PasswordFileEntry) {
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
