import {AbstractLinuxFileDatabase, type AbstractLinuxFileDatabaseProps, type RawDataMap} from '../../src/v1/AbstractLinuxFileDatabase';
import {type BaseEntry, type DistinctKey} from '../../src/types/v1/baseEntry';
import {type ILoggerLike} from '@avanio/logger-like';
import {type ServiceStatusObject} from '../../src/interfaces/ServiceStatus';

export abstract class AbstractLinuxMock<Entry extends BaseEntry> extends AbstractLinuxFileDatabase<AbstractLinuxFileDatabaseProps, Entry, number> {
	public abstract override readonly name: string;
	private _state: ServiceStatusObject = {status: 'online'};
	private _backup = new Map<number, string>();
	protected abstract _data: Map<number, string>;

	constructor(logger: ILoggerLike) {
		super({logger});
	}

	public setState(state: ServiceStatusObject) {
		this._state = state;
	}

	public status(): Promise<ServiceStatusObject> {
		return Promise.resolve(this._state);
	}

	protected storeOutput(value: RawDataMap<number, string>): Promise<void> {
		this._data = new Map(value);
		return Promise.resolve();
	}

	protected loadOutput(): RawDataMap<number, string> {
		return new Map(this._data);
	}

	protected async verifyWrite(value: Entry): Promise<boolean> {
		const entryList = Array.from((await this.list()).values());
		return entryList.some((entry) => this.isSameEntry(entry, value));
	}

	protected async verifyDelete(value: DistinctKey<Entry, number>) {
		const entryList = Array.from((await this.list()).values());
		return entryList.some((entry) => !this.isSameEntry(entry, value));
	}

	protected createBackup(): void | Promise<void> {
		this._backup = new Map(this._data);
	}

	protected restoreBackup(): void | Promise<void> {
		this._data = new Map(this._backup);
	}

	/**
	 * If line number is provided as DN, use it, otherwise get the next available line number.
	 */
	protected getDnKeys({dn, data}: {value: Entry; data: RawDataMap<number, string>; dn?: number | undefined}): number[] {
		const currentIndex = dn || Array.from(data.keys()).reduce((prev, current) => Math.max(prev, current), 0) + 1;
		return [currentIndex];
	}

	protected isSameKey(a: number, b: number): boolean {
		return a === b;
	}

	protected abstract override toOutput(value: Entry): string;

	protected abstract override fromOutput(value: string): Entry | undefined;

	protected abstract override isSameEntry(a: Entry | DistinctKey<Entry, number>, b: Entry | DistinctKey<Entry, number> | undefined): boolean;
}
