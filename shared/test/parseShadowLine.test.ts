/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import {parseShadowLine} from '../src/lib/shadowLineParser';
import {ShadowEntry} from '../src/types/v1/shadowEntry';
import type {ILoggerLike} from '@avanio/logger-like';

const expect = chai.expect;

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
	{input: 'not valid shadow line', output: undefined, infoCount: 1, infoMessages: ['Invalid shadow line: not valid shadow line']},
	{input: 'ää:*:16193:0:99999:7:::', output: undefined, infoCount: 1, infoMessages: ['Invalid shadow line: ää:*:16193:0:99999:7:::']},
	{input: 'root:*:16193:0:99999:7::undefined:', output: undefined, infoCount: 1, infoMessages: ['Invalid shadow line: root:*:16193:0:99999:7::undefined:']},
];

describe('parseShadowLine', () => {
	it('should parse valid lines', async () => {
		validHostTest.forEach(({input, output}) => {
			const entry = parseShadowLine(input);
			expect(entry).to.not.be.undefined;
			expect(entry).to.deep.equal(output);
		});
	});
	it('should not parse broken lines', async () => {
		brokenHostTest.forEach(({input, output, infoCount, infoMessages}) => {
			infoSpy.resetHistory();
			const entry = parseShadowLine(input, spyLogger);
			expect(entry).to.be.undefined;
			expect(entry).to.be.equal(output);
			expect(infoSpy.callCount).to.be.equal(infoCount);
			expect(infoSpy.getCalls().map((call) => call.args[0])).to.be.deep.equal(infoMessages);
		});
	});
});
