/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {existsSync} from 'fs';
import {LinuxNssFile} from '../src';
import {type NssEntry} from '@avanio/os-api-shared';

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: NssEntry = {
	database: 'initgroups',
	providers: [{provider: 'files'}],
};

const file = './test/nsswitch.conf';
const backupFile = './test/nsswitch.conf.bak';

let linuxNss: LinuxNssFile;

describe('linux nss file API', () => {
	before(() => {
		linuxNss = new LinuxNssFile({file, backupFile, backup: true});
	});
	beforeEach(async () => {
		await copyFile('./test/nsswitch.test', file);
		if (existsSync(backupFile)) {
			await unlink(backupFile);
		}
	});
	it('should list entries', async () => {
		const data = await linuxNss.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys('database', 'providers', 'line'));
		expect(existsSync(backupFile)).to.be.eq(false); // no write yet
		expect(await linuxNss.count()).to.be.eq(10);
	});
	it('should add valid entry to EOF', async () => {
		await linuxNss.add(testData);
		const data = await linuxNss.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should add valid entry middle of file', async () => {
		await linuxNss.add(testData, 4);
		const data = await linuxNss.list();
		expect(data.find((d) => d.line === 4)).to.deep.equal({line: 4, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should modify entry', async () => {
		let value = (await linuxNss.list()).find((d) => d.database === 'networks');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxNss.replace(value, {...value, providers: [{provider: 'files'}, {provider: 'db'}]});
		value = (await linuxNss.list()).find((d) => d.database === 'networks');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(value.providers.some((p) => p.provider === 'db')).to.be.eq(true);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should add valid entry to EOF if index is bigger than array length', async () => {
		await linuxNss.add(testData, 999);
		const data = await linuxNss.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should delete entry from file', async () => {
		await linuxNss.add(testData);
		const data = await linuxNss.list();
		const testEntry = data.find((d) => d.database === testData.database);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxNss.delete(testEntry)).to.be.eventually.eq(true);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await linuxNss.add(testData);
		const data = await linuxNss.list();
		const testEntry = data.find((d) => d.database === testData.database);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxNss.add({database: 'publickey', providers: [{provider: 'files'}]}, 4);
		await expect(linuxNss.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxNssFile: might have been changed since the entry was read');
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await linuxNss.add(testData);
		const data = await linuxNss.list();
		const testEntry = data.find((d) => d.database === testData.database);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxNss.delete({database: 'publickey', providers: [{provider: 'files'}], line: 999})).to.be.eventually.eq(false);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	after(async () => {
		await unlink(file);
		await unlink(backupFile);
	});
});
