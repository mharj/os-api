import {ServiceStatusObject, ShadowEntry} from '../../src';
import {AbstractLinuxShadow} from '../../src/v1/AbstractLinuxShadow';
import {ILoggerLike} from '@avanio/logger-like';
import {parseShadowLine} from '../../src/lib/shadowLineParser';

function nS(value: number | undefined): string {
	if (value === undefined) {
		return '';
	}
	return value.toString();
}

function uS(value: string | undefined): string {
	if (value === undefined) {
		return '';
	}
	return value;
}

export function buildOutput(value: ShadowEntry): string {
	const data = `${value.username}:${value.password}:${value.changed}:${value.min}:${value.max}:${value.warn}:${nS(value.inactive)}:${nS(value.expire)}:${uS(
		value.reserved,
	)}`;
	if (parseShadowLine(data) === undefined) {
		throw new Error(`Invalid output line: ${data}`);
	}
	return data;
}

export class MockLinuxShadow extends AbstractLinuxShadow {
	public name = 'MockLinuxShadow';
	private logger: ILoggerLike;
	private _state: ServiceStatusObject = {status: 'online'};
	private _data: string[] = [
		'# linux shadow file with comments',
		'root:*:16193:0:99999:7:::',
		'daemon:*:16193:0:99999:7:::',
		'bin:*:16193:0:99999:7:::',
		'sys:*:16193:0:99999:7:::',
	];

	constructor(logger: ILoggerLike) {
		super();
		this.logger = logger;
	}

	public status(): Promise<ServiceStatusObject> {
		return Promise.resolve(this._state);
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
}
