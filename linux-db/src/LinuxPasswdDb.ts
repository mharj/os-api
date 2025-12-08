import {AbstractMakeDbDatabase, type AbstractMakeDbDatabaseProps, type MakeDbKey} from './AbstractMakeDbDatabase';
import {type DistinctKey, parsePasswdLine, passwdLineBuilder, type PasswordEntry, type RawDataMap, validateLinuxPasswordEntry} from '@avanio/os-api-shared';

const initialProps = {
	backup: false,
	backupFile: '/var/lib/misc/passwd.db.bak',
	file: '/var/lib/misc/passwd.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
} satisfies AbstractMakeDbDatabaseProps;

export class LinuxPasswdDb extends AbstractMakeDbDatabase<AbstractMakeDbDatabaseProps, PasswordEntry> {
	public readonly name = 'LinuxPasswdDb';
	constructor(props: Partial<AbstractMakeDbDatabaseProps> = {}) {
		super(Object.assign({}, initialProps, props));
	}

	protected toOutput(value: PasswordEntry): string {
		return passwdLineBuilder(value);
	}

	protected fromOutput(value: string, dn: string | number): PasswordEntry | undefined {
		if (typeof dn === 'number') {
			return parsePasswdLine(value, this.logger);
		}
		return undefined;
	}

	protected validateEntry(entry: PasswordEntry): void {
		validateLinuxPasswordEntry(entry);
	}

	protected isSameEntry(a: PasswordEntry | DistinctKey<PasswordEntry, string>, b: PasswordEntry | DistinctKey<PasswordEntry, string> | undefined): boolean {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected override getDnKeys({dn, value, data}: {value: PasswordEntry; data: RawDataMap<MakeDbKey, string>; dn?: string | number | undefined}): MakeDbKey[] {
		return [this.getPrimaryIndexKey(data, dn), `=${value.uid}`, `.${value.username}`];
	}
}
