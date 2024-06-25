/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import {describe, expect, it} from '@jest/globals';
import * as sinon from 'sinon';
import type {ILoggerLike} from '@avanio/logger-like';
import {MockLinuxShadow, buildOutput} from './mockup/MockLinuxShadow';
import {shadowEntrySchema, type ShadowEntry} from '../src';

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

const newEntry: ShadowEntry = {
	username: 'testuser',
	password: 'x',
	changed: 1000,
	min: 0,
	max: 1000,
	warn: 7,
	inactive: undefined,
	expire: undefined,
};

const brokenEntry: ShadowEntry = {
	username: 'asd,wer,rtyqww',
	password: 'x',
	changed: 1000,
	min: 0,
	max: 1000,
	warn: 7,
	inactive: undefined,
	expire: undefined,
};

const testClass = new MockLinuxShadow(spyLogger);

describe('Linux Shadow', () => {
	it('should get list of entries', async () => {
		const data = await testClass.list();
		data.forEach((e) => {
			expect(e).not.toBe(undefined);
			expect(shadowEntrySchema.safeParse(e).success).toBe(true);
		});
	});
	it('should add entry to list', async () => {
		const newEntryString = buildOutput(newEntry);
		expect(await testClass.add(newEntry)).toBe(true);
		const line = (await testClass.listRaw()).find((e) => e === newEntryString);
		expect(line).not.toBe(undefined);
	});
	it('should replace entry in list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.replace(currentEntry, {...newEntry, password: '*'})).toBe(true);
		currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(currentEntry.password).toBe('*');
	});
	it('should delete entry from list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		await testClass.delete(currentEntry);
		currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		expect(currentEntry).toBe(undefined);
	});
	it('should throw error on broken entry', async () => {
		await expect(testClass.add(brokenEntry)).rejects.toThrow(
			`Invalid shadow entry: "username" Invalid. {"username":"asd,wer,rtyqww","password":"x","changed":1000,"min":0,"max":1000,"warn":7}`,
		);
	});
});
