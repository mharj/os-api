/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {type HostEntry} from '@avanio/os-api-shared';
import {LinuxHostsDb} from '../src';

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: HostEntry = {
	address: '192.168.0.1',
	hostname: 'test',
	aliases: ['test'],
	comment: 'test',
};

let linuxHosts: LinuxHostsDb;

describe('linux hosts db API', () => {
	before(async function () {
		await copyFile('./test/files/hosts.test.db', './test/hosts.db');
		linuxHosts = new LinuxHostsDb({file: './test/hosts.db', sudo: true});
		const status = await linuxHosts.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/hosts.test.db', './test/hosts.db');
	});
	it('should list hosts entries', async () => {
		const data = await linuxHosts.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['line', 'address', 'hostname', 'aliases', 'comment']));
	});
	it('should add valid entry', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({line: testEntry.line, ...testData, comment: undefined});
	});
	it('should delete host entry from file', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxHosts.delete(testEntry)).to.be.eventually.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxHosts.add({address: '10.10.10.1', hostname: 'some', aliases: []});
		await expect(linuxHosts.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxHostsDb: might have been changed since the entry was read');
	});
	it('should return false if deleting not existing entry', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxHosts.delete({line: 9999, address: '10.10.10.10', hostname: 'asd', aliases: []})).to.be.eventually.eq(false);
	});
	after(async () => {
		await unlink('./test/hosts.db');
	});
});
