import {AbstractMakeDbDatabase, type AbstractMakeDbDatabaseProps, type MakeDbKey} from './AbstractMakeDbDatabase';
import {type DistinctKey, parseShadowLine, type RawDataMap, type ShadowEntry, shadowLineBuilder, validateLinuxShadowEntry} from '@avanio/os-api-shared';

const initialProps = {
	backup: false,
	backupFile: '/var/lib/misc/shadow.db.bak',
	file: '/var/lib/misc/shadow.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
} satisfies AbstractMakeDbDatabaseProps;

export class LinuxShadowDb extends AbstractMakeDbDatabase<AbstractMakeDbDatabaseProps, ShadowEntry> {
	public readonly name = 'LinuxShadowDb';

	constructor(props: Partial<AbstractMakeDbDatabaseProps> = {}) {
		super(Object.assign({}, initialProps, props));
	}

	protected toOutput(value: ShadowEntry): string {
		return shadowLineBuilder(value);
	}

	protected fromOutput(value: string, dn: string | number): ShadowEntry | undefined {
		if (typeof dn === 'number') {
			return parseShadowLine(value, this.logger);
		}
		return undefined;
	}

	protected isSameEntry(
		a: ShadowEntry | DistinctKey<ShadowEntry, string | number>,
		b: ShadowEntry | DistinctKey<ShadowEntry, string | number> | undefined,
	): boolean {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected validateEntry(entry: ShadowEntry): void {
		validateLinuxShadowEntry(entry);
	}

	protected override getDnKeys({dn, value, data}: {value: ShadowEntry; data: RawDataMap<MakeDbKey, string>; dn?: string | number | undefined}): MakeDbKey[] {
		return [this.getPrimaryIndexKey(data, dn), `.${value.username}`];
	}
}
