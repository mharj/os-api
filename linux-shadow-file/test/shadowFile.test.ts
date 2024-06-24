/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {existsSync} from 'fs';
import {LinuxShadow} from '../src';
import {type ShadowEntry} from '@avanio/os-api-shared';

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: ShadowEntry = {
	username: 'test',
	password: 'x',
	changed: 16193,
	min: 0,
	max: 99999,
	warn: 7,
	inactive: undefined,
	expire: undefined,
	reserved: undefined,
};

const file = './test/shadow';
const backupFile = './test/shadow.bak';

let linuxShadow: LinuxShadow;

describe('linux shadow file API', () => {
	before(() => {
		linuxShadow = new LinuxShadow({file, backupFile, backup: true});
	});
	beforeEach(async () => {
		await copyFile('./test/shadow.test', file);
		if (existsSync(backupFile)) {
			await unlink(backupFile);
		}
	});
	it('should list entries', async () => {
		const data = await linuxShadow.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys('username', 'password', 'changed', 'min', 'max', 'warn', 'inactive', 'expire', 'reserved', 'line'));
		expect(existsSync(backupFile)).to.be.eq(false); // no write yet
	});
	it('should add valid entry to EOF', async () => {
		await linuxShadow.add(testData);
		const data = await linuxShadow.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should add valid entry middle of file', async () => {
		await linuxShadow.add(testData, 4);
		const data = await linuxShadow.list();
		expect(data.find((d) => d.line === 4)).to.deep.equal({line: 4, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should modify entry', async () => {
		let value = (await linuxShadow.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxShadow.replace(value, {...value, changed: 16194});
		value = (await linuxShadow.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(value.changed).to.be.eq(16194);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should add valid entry to EOF if index is bigger than array length', async () => {
		await linuxShadow.add(testData, 999);
		const data = await linuxShadow.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should fail to add not valid entry to file', async () => {
		await expect(linuxShadow.add({...testData, username: 'äöäöä'}, 999)).to.be.eventually.rejectedWith(TypeError);
		expect(existsSync(backupFile)).to.be.eq(false); // no write yet
	});
	it('should delete entry from file', async () => {
		await linuxShadow.add(testData);
		const data = await linuxShadow.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxShadow.delete(testEntry)).to.be.eventually.eq(true);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await linuxShadow.add(testData);
		const data = await linuxShadow.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxShadow.add({username: 'test2', password: 'x', changed: 16193, min: 0, max: 9999, warn: 7}, 4);
		await expect(linuxShadow.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxShadowFile: might have been changed since the entry was read');
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await linuxShadow.add(testData);
		const data = await linuxShadow.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxShadow.delete({username: 'test2', password: 'x', changed: 16193, min: 0, max: 9999, warn: 7, line: 999})).to.be.eventually.eq(false);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	after(async () => {
		await unlink(file);
		await unlink(backupFile);
	});
});
