import {type DistinctKey, type ShadowEntry, shadowLineBuilder, validateLinuxShadowEntry} from '../../src';
import {AbstractLinuxMock} from './AbstractLinuxMock';
import {parseShadowLine} from '../../src/lib/shadowLineParser';

export function buildOutput(value: ShadowEntry): string {
	const data = shadowLineBuilder(value);
	if (parseShadowLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

const rawData = `# linux shadow file with comments
root:*:19749:0:99999:7:::
bin:*:19749:0:99999:7:::
daemon:*:19749:0:99999:7:::
adm:*:19749:0:99999:7:::
lp:*:19749:0:99999:7:::
sync:*:19749:0:99999:7:::
shutdown:*:19749:0:99999:7:::
halt:*:19749:0:99999:7:::
mail:*:19749:0:99999:7:::
operator:*:19749:0:99999:7:::
games:*:19749:0:99999:7:::
ftp:*:19749:0:99999:7:::
nobody:*:19749:0:99999:7:::
tss:!:19827::::::`;

export class MockLinuxShadow extends AbstractLinuxMock<ShadowEntry> {
	public readonly name = 'MockLinuxShadow';
	protected _data = new Map<number, string>(rawData.split('\n').map((line, index) => [index, line]));

	protected isSameEntry(a: ShadowEntry | DistinctKey<ShadowEntry, number>, b: ShadowEntry | DistinctKey<ShadowEntry, number> | undefined) {
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
}
