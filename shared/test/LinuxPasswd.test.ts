/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import {describe, expect, it} from '@jest/globals';
import * as sinon from 'sinon';
import type {ILoggerLike} from '@avanio/logger-like';
import {MockLinuxPasswd, buildOutput} from './mockup/MockLinuxPasswd';
import {passwdEntrySchema, type PasswordEntry} from '../src';

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

const newEntry: PasswordEntry = {
	username: 'testuser',
	password: 'x',
	uid: 1000,
	gid: 1000,
	gecos: 'test user',
	home: '/home/testuser',
	shell: '/bin/bash',
};

const brokenEntry: PasswordEntry = {
	username: 'asd,wer,rtyqww',
	password: 'x',
	uid: 1000,
	gid: 1000,
	gecos: 'test user',
	home: '/home/testuser',
	shell: '/bin/bash',
};

const testClass = new MockLinuxPasswd(spyLogger);

describe('Linux Passwd', () => {
	it('should get list of entries', async () => {
		const data = await testClass.list();
		data.forEach((e) => {
			expect(e).not.toBe(undefined);
			expect(passwdEntrySchema.safeParse(e).success).toBe(true);
		});
	});
	it('should add entry to list', async () => {
		const newEntryString = buildOutput(newEntry);
		expect(await testClass.add(newEntry)).toBe(true);
		const line = Array.from(await testClass.listRaw()).find(([_line, v]) => v === newEntryString);
		expect(line).not.toBe(undefined);
	});
	it('should replace entry in list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		expect(currentEntry).not.toBe(undefined);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.replace(currentEntry, {...newEntry, shell: '/bin/sh'})).toBe(true);
		currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		expect(currentEntry).not.toBe(undefined);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(currentEntry.shell).toBe('/bin/sh');
	});
	it('should delete entry from list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		expect(currentEntry).not.toBe(undefined);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.delete(currentEntry)).toBe(true);
		currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		expect(currentEntry).toBe(undefined);
	});
	it('should throw error on broken entry', async () => {
		await expect(testClass.add(brokenEntry)).rejects.toThrow(
			`Invalid passwd entry: "username" contains invalid characters. {"username":"asd,wer,rtyqww","password":"x","uid":1000,"gid":1000,"gecos":"test user","home":"/home/testuser","shell":"/bin/bash"}`,
		);
	});
});
