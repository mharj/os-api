import type {ILoggerLike} from '@avanio/logger-like';
import {describe, expect, it, vi} from 'vitest';
import {parseHostLine} from '../src/lib/hostLineParser';
import type {HostEntry} from '../src/types/v1/hostEntry';

const infoSpy = vi.fn();
const warnSpy = vi.fn();
const errorSpy = vi.fn();
const debugSpy = vi.fn();

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
			infoSpy.mockClear();
			const entry = parseHostLine(input, spyLogger);
			expect(entry).toBe(undefined);
			expect(entry).toBe(output);
			expect(infoSpy.mock.calls.length).toBe(infoCount);
			expect(infoSpy.mock.calls.map((call) => call[0])).toEqual(infoMessages);
		});
	});
});
