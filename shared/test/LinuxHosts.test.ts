/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import type {ILoggerLike} from '@avanio/logger-like';
import {MockLinuxHosts, buildOutput} from './mockup/MockLinuxHosts';
import {HostEntry} from '../src/types/v1/hostEntry';

chai.use(chaiAsPromised);

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

const newEntry: HostEntry = {
	address: '10.10.10.10',
	hostname: 'testhost',
	aliases: ['testhost1', 'testhost2'],
	comment: 'test1 comment',
};

const brokenIpEntry: HostEntry = {
	address: 'asd,wer,rtyqww',
	hostname: 'testhost',
	aliases: ['testhost1', 'testhost2'],
	comment: 'test2 comment',
};

const brokenHostnameEntry: HostEntry = {
	address: '10.10.10.10',
	hostname: '!#testhost',
	aliases: ['testhost1', 'testhost2'],
	comment: 'test3 comment',
};

const testClass = new MockLinuxHosts(spyLogger);

describe('LinuxHosts', () => {
	it('should get list of Host entries', async () => {
		const data = await testClass.list();
		data.forEach((e) => {
			expect(e).to.not.be.undefined;
			expect(e).to.have.keys(['address', 'hostname', 'aliases', 'comment', 'line']);
		});
	});
	it('should add host entry to list', async () => {
		const newEntryString = buildOutput(newEntry);
		await testClass.add(newEntry);
		const line = (await testClass.listRaw()).find((e) => e === newEntryString);
		expect(line).to.not.be.undefined;
	});
	it('should delete host entry from list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.hostname === newEntry.hostname);
		expect(currentEntry).to.not.be.undefined;
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		await testClass.delete(currentEntry);
		currentEntry = (await testClass.list()).find((e) => e.hostname === newEntry.hostname);
		expect(currentEntry).to.be.undefined;
	});
	it('should throw error on broken IP address', async () => {
		await expect(testClass.add(brokenIpEntry)).to.be.eventually.rejectedWith(TypeError, `Invalid IP address value: ${brokenIpEntry.address}`);
	});
	it('should throw error on broken hostname', async () => {
		await expect(testClass.add(brokenHostnameEntry)).to.be.eventually.rejectedWith(TypeError, `Invalid hostname value: ${brokenHostnameEntry.hostname}`);
	});
});
