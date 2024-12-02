/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as sinon from 'sinon';
import {describe, expect, it} from 'vitest';
import {type HostEntry} from '../src/types/v1/hostEntry';
import type {ILoggerLike} from '@avanio/logger-like';
import {parseHostLine} from '../src/lib/hostLineParser';

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
	output: HostEntry | undefined;
};

const validHostTest: TestValue[] = [
	{
		input: '127.0.0.1     localhost',
		output: {address: '127.0.0.1', hostname: 'localhost', aliases: [], comment: undefined},
	},
	{
		input: '127.0.0.1	localhost',
		output: {address: '127.0.0.1', hostname: 'localhost', aliases: [], comment: undefined},
	},
	{
		input: '127.0.0.1	localhost # some comments are here',
		output: {address: '127.0.0.1', hostname: 'localhost', aliases: [], comment: 'some comments are here'},
	},
	{
		input: '127.0.0.1     localhost # # some comments are here',
		output: {address: '127.0.0.1', hostname: 'localhost', aliases: [], comment: 'some comments are here'},
	},
];

type TestBrokenValue = {
	input: string;
	output: HostEntry | undefined;
	infoCount: number;
	infoMessages: string[];
};

const brokenHostTest: TestBrokenValue[] = [
	{input: '# some comments here', output: undefined, infoCount: 0, infoMessages: []},
	{input: '# 127.0.0.1	localhost # some comments are here', output: undefined, infoCount: 0, infoMessages: []},
	{input: '', output: undefined, infoCount: 0, infoMessages: []},
	{
		input: 'not.ip.value.here    localhost',
		output: undefined,
		infoCount: 1,
		infoMessages: ['Invalid hosts line: "address" Invalid IP address. {"address":"not.ip.value.here","aliases":[],"hostname":"localhost"}'],
	},
	{
		input: '127.0.0.1	&!localhost',
		output: undefined,
		infoCount: 1,
		infoMessages: ['Invalid hosts line: "hostname" Invalid hostname. {"address":"127.0.0.1","aliases":[],"hostname":"&!localhost"}'],
	},
];

describe('parseHostLine', function () {
	it('should parse valid lines', function () {
		validHostTest.forEach(({input, output}) => {
			const entry = parseHostLine(input);
			expect(entry).not.toBe(undefined);
			expect(entry).toEqual(output);
		});
	});
	it('should not parse broken lines', function () {
		brokenHostTest.forEach(({input, output, infoCount, infoMessages}) => {
			infoSpy.resetHistory();
			const entry = parseHostLine(input, spyLogger);
			expect(entry).toBe(undefined);
			expect(entry).toBe(output);
			expect(infoSpy.callCount).toBe(infoCount);
			expect(infoSpy.getCalls().map((call) => call.args[0])).toEqual(infoMessages);
		});
	});
});
