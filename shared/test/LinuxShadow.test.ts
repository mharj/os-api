/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sort-imports */
/* eslint-disable sort-keys */
/* eslint-disable no-unused-expressions */
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import * as sinon from 'sinon';
import type {ILoggerLike} from '@avanio/logger-like';
import {MockLinuxShadow, buildOutput} from './mockup/MockLinuxShadow';
import {ShadowEntry} from '../src';

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
			expect(e).to.not.be.undefined;
			expect(e).to.have.keys(['username', 'password', 'changed', 'min', 'max', 'warn', 'inactive', 'expire', 'reserved', 'line']);
		});
	});
	it('should add entry to list', async () => {
		const newEntryString = buildOutput(newEntry);
		expect(await testClass.add(newEntry)).to.be.true;
		const line = (await testClass.listRaw()).find((e) => e === newEntryString);
		expect(line).to.not.be.undefined;
	});
	it('should replace entry in list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(await testClass.replace(currentEntry, {...newEntry, password: '*'})).to.be.true;
		currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		expect(currentEntry.password).to.be.equal('*');
	});
	it('should delete entry from list', async () => {
		let currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		if (!currentEntry) {
			throw new Error('currentEntries is undefined');
		}
		await testClass.delete(currentEntry);
		currentEntry = (await testClass.list()).find((e) => e.username === newEntry.username);
		expect(currentEntry).to.be.undefined;
	});
	it('should throw error on broken entry', async () => {
		await expect(testClass.add(brokenEntry)).to.be.eventually.rejectedWith(
			TypeError,
			`Invalid shadow entry: "username" Invalid. {"username":"asd,wer,rtyqww","password":"x","changed":1000,"min":0,"max":1000,"warn":7}`,
		);
	});
});
