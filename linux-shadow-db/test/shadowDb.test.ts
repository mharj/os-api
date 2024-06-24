/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {existsSync} from 'fs';
import {LinuxShadowDb} from '../src';
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

const file = './test/shadow.db';
const backupFile = './test/shadow.db.bak';

let linuxShadow: LinuxShadowDb;

describe('linux shadow db API', () => {
	before(async function () {
		await copyFile('./test/files/shadow.test.db', file);
		linuxShadow = new LinuxShadowDb({file, backup: true, backupFile, sudo: true});
		const status = await linuxShadow.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/shadow.test.db', file);
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
	it('should add valid entry', async () => {
		await linuxShadow.add(testData);
		const data = await linuxShadow.list();
		const testEntry = data.find((d) => d.username === testData.username);
		expect(testEntry).to.deep.equal({line: testEntry?.line, ...testData});
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
		await linuxShadow.add({username: 'test2', password: 'x', changed: 16193, min: 0, max: 9999, warn: 7});
		await expect(linuxShadow.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxShadowDb: might have been changed since the entry was read');
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
