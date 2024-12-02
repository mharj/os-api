import * as sinon from 'sinon';
import {buildOutput, MockLinuxHosts} from './mockup/MockLinuxHosts';
import {describe, expect, it} from 'vitest';
import {type HostEntry, hostEntrySchema} from '../src/';
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
			expect(e).not.toBe(undefined);
			expect(hostEntrySchema.safeParse(e).success).toBe(true);
		});
	});
	it('should add host entry to list', async () => {
		const newEntryString = buildOutput(newEntry);
		expect(await testClass.add(newEntry)).toBe(true);
		const line = Array.from(await testClass.listRaw()).find(([_line, v]) => v === newEntryString);
		expect(line).not.toBe(undefined);
	});
	it('should replace host entry to list', async () => {
		const currentEntry = (await testClass.list()).find((e) => e.hostname === newEntry.hostname);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.replace(currentEntry, {...newEntry, comment: 'demo'})).toBe(true);
	});
	it('should delete host entry from list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.hostname === newEntry.hostname);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.delete(currentEntry)).toBe(true);
		currentEntry = (await testClass.list()).find((e) => e.hostname === newEntry.hostname);
		expect(currentEntry).toBe(undefined);
	});
	it('should throw error on broken IP address', async () => {
		await expect(testClass.add(brokenIpEntry)).rejects.toThrow(
			'Invalid hosts entry: "address" Invalid IP address. {"address":"asd,wer,rtyqww","hostname":"testhost","aliases":["testhost1","testhost2"],"comment":"test2 comment"}',
		);
	});
	it('should throw error on broken hostname', async () => {
		await expect(testClass.add(brokenHostnameEntry)).rejects.toThrow(
			'Invalid hosts entry: "hostname" Invalid hostname. {"address":"10.10.10.10","hostname":"!#testhost","aliases":["testhost1","testhost2"],"comment":"test3 comment"}',
		);
	});
});
