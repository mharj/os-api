import {AbstractMakeDbDatabase, type AbstractMakeDbDatabaseProps, type MakeDbKey} from './AbstractMakeDbDatabase';
import {type DistinctKey, parseServicesLine, type RawDataMap, type ServicesEntry, servicesLineBuilder, validateLinuxServicesEntry} from '@avanio/os-api-shared';

const initialProps = {
	backup: false,
	backupFile: '/var/lib/misc/services.db.bak',
	file: '/var/lib/misc/services.db',
	makedb: '/usr/bin/makedb',
	sudo: false,
} satisfies AbstractMakeDbDatabaseProps;

export class LinuxServicesDb extends AbstractMakeDbDatabase<AbstractMakeDbDatabaseProps, ServicesEntry> {
	public readonly name = 'LinuxServicesDb';

	constructor(props: Partial<AbstractMakeDbDatabaseProps> = {}) {
		super(Object.assign({}, initialProps, props));
	}

	protected toOutput(value: ServicesEntry): string {
		return servicesLineBuilder(value);
	}

	protected fromOutput(value: string, dn: string | number): ServicesEntry | undefined {
		if (typeof dn === 'number') {
			return parseServicesLine(value, this.logger);
		}
		return undefined;
	}

	protected isSameEntry(
		a: ServicesEntry | DistinctKey<ServicesEntry, string | number>,
		b: ServicesEntry | DistinctKey<ServicesEntry, string | number> | undefined,
	): boolean {
		if (!b) {
			return false;
		}
		return a.service === b.service && a.port === b.port && a.protocol === b.protocol;
	}

	protected validateEntry(entry: ServicesEntry): void {
		validateLinuxServicesEntry(entry);
	}

	protected override getDnKeys({dn, value, data}: {value: ServicesEntry; data: RawDataMap<MakeDbKey, string>; dn?: string | number | undefined}): MakeDbKey[] {
		const primaryIndex = this.getPrimaryIndexKey(data, dn);
		const outputKeys: MakeDbKey[] = [primaryIndex];
		outputKeys.push(`=${value.port}/`);
		outputKeys.push(`=${value.port}/${value.protocol}`);
		outputKeys.push(`.${value.service}/`);
		outputKeys.push(`.${value.service}/${value.protocol}`);
		for (const alias of value.aliases) {
			outputKeys.push(`.${alias}/`);
			outputKeys.push(`.${alias}/${value.protocol}`);
		}
		return outputKeys;
	}
}
