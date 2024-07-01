import {
	AbstractLinuxFileDatabase,
	type AbstractLinuxFileDatabaseProps,
	type ServiceStatusObject,
	type ShadowEntry,
	type ShadowFileEntry,
	shadowLineBuilder,
	validateLinuxShadowEntry,
} from '../../src';
import {type ILoggerLike} from '@avanio/logger-like';
import {parseShadowLine} from '../../src/lib/shadowLineParser';

export function buildOutput(value: ShadowEntry): string {
	const data = shadowLineBuilder(value);
	if (parseShadowLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxShadow extends AbstractLinuxFileDatabase<AbstractLinuxFileDatabaseProps, ShadowEntry, ShadowFileEntry> {
	public name = 'MockLinuxShadow';
	private _state: ServiceStatusObject = {status: 'online'};
	private _data: string[] = [
		'# linux shadow file with comments',
		'root:*:16193:0:99999:7:::',
		'daemon:*:16193:0:99999:7:::',
		'bin:*:16193:0:99999:7:::',
		'sys:*:16193:0:99999:7:::',
	];

	private _backup: string[] = [];

	constructor(logger: ILoggerLike) {
		super({logger});
	}

	public status(): Promise<ServiceStatusObject> {
		return Promise.resolve(this._state);
	}

	protected isSameEntry(a: ShadowEntry | ShadowFileEntry, b: ShadowEntry | ShadowFileEntry | undefined) {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected validateEntry(entry: ShadowEntry): void {
		validateLinuxShadowEntry(entry);
	}

	protected toOutput(value: ShadowEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): ShadowEntry | undefined {
		return parseShadowLine(value, this.logger);
	}

	protected storeOutput(value: string[]): Promise<void> {
		this._data = [...value];
		return Promise.resolve();
	}

	protected loadOutput(): Promise<string[]> {
		return Promise.resolve([...this._data]);
	}

	protected verifyWrite(value: ShadowEntry) {
		return this._data.includes(this.toOutput(value));
	}

	protected verifyDelete(value: ShadowFileEntry) {
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
