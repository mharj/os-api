import {type DistinctKey, passwdLineBuilder, type PasswordEntry, validateLinuxPasswordEntry} from '../../src';
import {AbstractLinuxMock} from './AbstractLinuxMock';
import {parsePasswdLine} from '../../src/lib/passwdLineParser';

export function buildOutput(value: PasswordEntry): string {
	const data = passwdLineBuilder(value);
	if (parsePasswdLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

const rawData = `# linux passwd file with comments
root:x:0:0:Super User:/root:/bin/bash
bin:x:1:1:bin:/bin:/usr/sbin/nologin
daemon:x:2:2:daemon:/sbin:/usr/sbin/nologin
adm:x:3:4:adm:/var/adm:/usr/sbin/nologin
lp:x:4:7:lp:/var/spool/lpd:/usr/sbin/nologin
sync:x:5:0:sync:/sbin:/bin/sync
shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
halt:x:7:0:halt:/sbin:/sbin/halt
mail:x:8:12:mail:/var/spool/mail:/usr/sbin/nologin
operator:x:11:0:operator:/root:/usr/sbin/nologin
games:x:12:100:games:/usr/games:/usr/sbin/nologin
ftp:x:14:50:FTP User:/var/ftp:/usr/sbin/nologin
nobody:x:65534:65534:Kernel Overflow User:/:/usr/sbin/nologin
tss:x:59:59:Account used for TPM access:/:/usr/sbin/nologin`;

export class MockLinuxPasswd extends AbstractLinuxMock<PasswordEntry> {
	public readonly name = 'MockLinuxPasswd';

	protected _data = new Map<number, string>(rawData.split('\n').map((line, index) => [index, line]));

	protected toOutput(value: PasswordEntry): string {
		return buildOutput(value);
	}

	protected fromOutput(value: string): PasswordEntry | undefined {
		return parsePasswdLine(value, this.logger);
	}

	protected isSameEntry(a: PasswordEntry | DistinctKey<PasswordEntry, number>, b: PasswordEntry | DistinctKey<PasswordEntry, number> | undefined) {
		if (!b) {
			return false;
		}
		return a.username === b.username;
	}

	protected validateEntry(entry: PasswordEntry): void {
		validateLinuxPasswordEntry(entry);
	}
}
