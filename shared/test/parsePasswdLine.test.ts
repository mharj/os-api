/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import {describe, expect, it} from '@jest/globals';
import * as sinon from 'sinon';
import {parsePasswdLine} from '../src/lib/passwdLineParser';
import {type PasswordEntry} from '../src/types/v1/passwdEntry';
import type {ILoggerLike} from '@avanio/logger-like';

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
	output: PasswordEntry | undefined;
};

const validHostTest: TestValue[] = [
	{
		input: 'root:x:0:0:root:/root:/bin/bash',
		output: {username: 'root', password: 'x', uid: 0, gid: 0, gecos: 'root', home: '/root', shell: '/bin/bash'},
	},
	{
		input: 'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
		output: {username: 'nobody', password: 'x', uid: 65534, gid: 65534, gecos: 'nobody', home: '/nonexistent', shell: '/usr/sbin/nologin'},
	},
];

type TestBrokenValue = {
	input: string;
	output: PasswordEntry | undefined;
	infoCount: number;
	infoMessages: string[];
};

const brokenHostTest: TestBrokenValue[] = [
	{input: '# some comments here', output: undefined, infoCount: 0, infoMessages: []},
	{input: '', output: undefined, infoCount: 0, infoMessages: []},
	{
		input: 'not valid password line',
		output: undefined,
		infoCount: 1,
		infoMessages: ['Invalid passwd line: "username" contains invalid characters. {"username":"not valid password line","uid":false,"gid":false}'],
	},
	{
		input: 'ää:0:0:gecos:home:login',
		output: undefined,
		infoCount: 1,
		infoMessages: [
			'Invalid passwd line: "username" contains invalid characters. {"username":"ää","password":"0","uid":0,"gid":null,"gecos":"home","home":"login"}',
		],
	},
];

describe('parsePasswdLine', function () {
	it('should parse valid lines', function () {
		validHostTest.forEach(({input, output}) => {
			const entry = parsePasswdLine(input);
			expect(entry).not.toBeUndefined();
			expect(entry).toEqual(output);
		});
	});
	it('should not parse broken lines', function () {
		brokenHostTest.forEach(({input, output, infoCount, infoMessages}) => {
			infoSpy.resetHistory();
			const entry = parsePasswdLine(input, spyLogger);
			expect(entry).toBeUndefined();
			expect(entry).toEqual(output);
			expect(infoSpy.callCount).toBe(infoCount);
			expect(infoSpy.getCalls().map((call) => call.args[0])).toEqual(infoMessages);
		});
	});
});
