/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import {parseNssConfLine} from '../src/lib/nssConfLineParser';
import type {ILoggerLike} from '@avanio/logger-like';
import {type NssEntry} from '../src';

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
	output: NssEntry | undefined;
};

const validHostTest: TestValue[] = [
	{
		input: 'shadow:         compat',
		output: {database: 'shadow', providers: [{provider: 'compat'}]},
	},
	{
		input: 'hosts:          dns files',
		output: {database: 'hosts', providers: [{provider: 'dns'}, {provider: 'files'}]},
	},
	{
		input: 'hosts:          dns [!UNAVAIL=return] files',
		output: {database: 'hosts', providers: [{provider: 'dns', action: {status: '!UNAVAIL', action: 'return'}}, {provider: 'files'}]},
	},
];

type TestBrokenValue = {
	input: string;
	output: NssEntry | undefined;
	infoCount: number;
	infoMessages: string[];
};

const brokenHostTest: TestBrokenValue[] = [
	{input: '# some comments here', output: undefined, infoCount: 0, infoMessages: []},
	{input: '', output: undefined, infoCount: 0, infoMessages: []},
	{
		input: 'not valid nss line',
		output: undefined,
		infoCount: 1,
		infoMessages: [
			"Invalid nss line: \"database\" Invalid enum value. Expected 'aliases' | 'ethers' | 'group' | 'hosts' | 'initgroups' | 'netgroup' | 'networks' | 'passwd' | 'protocols' | 'publickey' | 'rpc' | 'services' | 'shadow', received 'not valid nss line'. {\"database\":\"not valid nss line\",\"providers\":[]}",
		],
	},
	{
		input: 'ää:0:0:gecos:home:login',
		output: undefined,
		infoCount: 1,
		infoMessages: [
			"Invalid nss line: \"database\" Invalid enum value. Expected 'aliases' | 'ethers' | 'group' | 'hosts' | 'initgroups' | 'netgroup' | 'networks' | 'passwd' | 'protocols' | 'publickey' | 'rpc' | 'services' | 'shadow', received 'ää'. {\"database\":\"ää\",\"providers\":[{\"provider\":\"0\"}]}",
		],
	},
];

describe('parseNssConfLine', function () {
	it('should parse valid lines', function () {
		validHostTest.forEach(({input, output}) => {
			const entry = parseNssConfLine(input);
			expect(entry).to.not.be.undefined;
			expect(entry).to.deep.equal(output);
		});
	});
	it('should not parse broken lines', function () {
		brokenHostTest.forEach(({input, output, infoCount, infoMessages}) => {
			infoSpy.resetHistory();
			const entry = parseNssConfLine(input, spyLogger);
			expect(entry).to.be.undefined;
			expect(entry).to.be.equal(output);
			expect(infoSpy.callCount).to.be.equal(infoCount);
			expect(infoSpy.getCalls().map((call) => call.args[0])).to.be.deep.equal(infoMessages);
		});
	});
});
