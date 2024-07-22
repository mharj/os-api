/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import {describe, expect, it} from '@jest/globals';
import * as sinon from 'sinon';
import type {ILoggerLike} from '@avanio/logger-like';
import {MockLinuxServices, buildOutput} from './mockup/MockLinuxServices';
import {servicesEntrySchema, type ServicesEntry} from '../src';

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

const newEntry: ServicesEntry = {
	service: 'testservice',
	port: 1234,
	protocol: 'tcp',
	aliases: ['testalias'],
};

const brokenEntry: ServicesEntry = {
	service: 'testservice',
	port: -1,
	protocol: 'tcp',
	aliases: ['testalias'],
};

const testClass = new MockLinuxServices(spyLogger);

describe('Linux Passwd', () => {
	it('should get list of entries', async () => {
		const data = await testClass.list();
		data.forEach((e) => {
			expect(e).not.toBe(undefined);
			expect(servicesEntrySchema.safeParse(e).success).toBe(true);
		});
	});
	it('should add entry to list', async () => {
		const newEntryString = buildOutput(newEntry);
		expect(await testClass.add(newEntry)).toBe(true);
		const line = Array.from(await testClass.listRaw()).find(([_line, v]) => v === newEntryString);
		expect(line).not.toBe(undefined);
	});
	it('should replace entry in list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.service === newEntry.service);
		expect(currentEntry).not.toBe(undefined);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.replace(currentEntry, {...newEntry, comment: 'test comment'})).toBe(true);
		currentEntry = (await testClass.list()).find((e) => e.service === newEntry.service);
		expect(currentEntry).not.toBe(undefined);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(currentEntry.comment).toBe('test comment');
	});
	it('should delete entry from list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.service === newEntry.service);
		expect(currentEntry).not.toBe(undefined);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		await testClass.delete(currentEntry);
		currentEntry = (await testClass.list()).find((e) => e.service === newEntry.service);
		expect(currentEntry).toBe(undefined);
	});
	it('should throw error on broken entry', async () => {
		await expect(testClass.add(brokenEntry)).rejects.toThrow(
			`Invalid services entry: "port" Number must be greater than or equal to 1. {"service":"testservice","port":-1,"protocol":"tcp","aliases":["testalias"]}`,
		);
	});
});
