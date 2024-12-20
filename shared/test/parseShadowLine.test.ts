/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as sinon from 'sinon';
import {describe, expect, it} from 'vitest';
import type {ILoggerLike} from '@avanio/logger-like';
import {parseShadowLine} from '../src/lib/shadowLineParser';
import {type ShadowEntry} from '../src/types/v1/shadowEntry';

const infoSpy = sinon.spy();
const warnSpy = sinon.spy();
const errorSpy = sinon.spy();
const debugSpy = sinon.spy();

const spyLogger: ILoggerLike = {
	info: infoSpy,
	warn: warnSpy,
	error: errorSpy,
	debug: debugSpy,
};

type TestValue = {
	input: string;
	output: ShadowEntry | undefined;
};

const validHostTest: TestValue[] = [
	{
		input: 'root:*:16193:0:99999:7:::',
		output: {username: 'root', password: '*', changed: 16193, min: 0, max: 99999, warn: 7, inactive: undefined, expire: undefined, reserved: undefined},
	},
	{
		input: 'nobody:*:16193:0:99999:7:::',
		output: {
			username: 'nobody',
			password: '*',
			changed: 16193,
			min: 0,
			max: 99999,
			warn: 7,
			inactive: undefined,
			expire: undefined,
			reserved: undefined,
		},
	},
];

type TestBrokenValue = {
	input: string;
	output: ShadowEntry | undefined;
	infoCount: number;
	infoMessages: string[];
};

const brokenHostTest: TestBrokenValue[] = [
	{input: '# some comments here', output: undefined, infoCount: 0, infoMessages: []},
	{input: '', output: undefined, infoCount: 0, infoMessages: []},
	{
		input: 'not valid shadow line',
		output: undefined,
		infoCount: 1,
		infoMessages: [
			'Invalid shadow line: "username" Invalid. {"username":"not valid shadow line","changed":false,"min":false,"max":false,"warn":false,"inactive":false,"expire":false}',
		],
	},
	{
		input: 'ää:*:16193:0:99999:7:::',
		output: undefined,
		infoCount: 1,
		infoMessages: ['Invalid shadow line: "username" Invalid. {"username":"ää","password":"*","changed":16193,"min":0,"max":99999,"warn":7}'],
	},
	{
		input: 'root:*:16193:0:99999:7::undefined:',
		output: undefined,
		infoCount: 1,
		infoMessages: [
			'Invalid shadow line: "expire" Expected number, received nan. {"username":"root","password":"*","changed":16193,"min":0,"max":99999,"warn":7,"expire":null}',
		],
	},
];

describe('parseShadowLine', function () {
	it('should parse valid lines', function () {
		validHostTest.forEach(({input, output}) => {
			const entry = parseShadowLine(input);
			expect(entry).not.toBeUndefined();
			expect(entry).toEqual(output);
		});
	});
	it('should not parse broken lines', function () {
		brokenHostTest.forEach(({input, output, infoCount, infoMessages}) => {
			infoSpy.resetHistory();
			const entry = parseShadowLine(input, spyLogger);
			expect(entry).toBeUndefined();
			expect(entry).toEqual(output);
			expect(infoSpy.callCount).toBe(infoCount);
			expect(infoSpy.getCalls().map((call) => call.args[0])).toEqual(infoMessages);
		});
	});
});
