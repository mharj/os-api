/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {HostEntry} from '@avanio/os-api-shared';
import {LinuxHosts} from '../src';

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: HostEntry = {
	address: '192.168.0.1',
	hostname: 'test',
	aliases: ['test'],
	comment: 'test comment',
};

let linuxHosts: LinuxHosts;

describe('linux hosts file API', () => {
	before(() => {
		linuxHosts = new LinuxHosts({file: './test/hosts'});
	});
	beforeEach(async () => {
		await copyFile('./test/hosts.test', './test/hosts');
	});
	it('should list hosts entries', async () => {
		const data = await linuxHosts.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['line', 'address', 'hostname', 'aliases', 'comment']));
	});
	it('should add valid entry to EOF', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
	});
	it('should add valid entry middle of file', async () => {
		await linuxHosts.add(testData, 4);
		const data = await linuxHosts.list();
		expect(data.find((d) => d.line === 4)).to.deep.equal({line: 4, ...testData});
	});
	it('should add valid entry to EOF if index is bigger than array length', async () => {
		await linuxHosts.add(testData, 999);
		const data = await linuxHosts.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
	});
	it('should fail to add no IP arress to file', async () => {
		await expect(linuxHosts.add({address: 'abc', hostname: 'abc', aliases: []}, 999)).to.be.eventually.rejectedWith(TypeError, 'Invalid IP address value: abc');
	});
	it('should fail to add non-valid hostname to file', async () => {
		await expect(linuxHosts.add({address: '127.0.0.1', hostname: 'ABC[]', aliases: []}, 999)).to.be.eventually.rejectedWith(
			TypeError,
			'Invalid hostname value: ABC[]',
		);
	});
	it('should fail to add non-valid host alias to file', async () => {
		await expect(linuxHosts.add({address: '127.0.0.1', hostname: 'localhost', aliases: ['ABC[]']}, 999)).to.be.eventually.rejectedWith(
			TypeError,
			'Invalid alias value in: ["ABC[]"]',
		);
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
		await linuxHosts.add({address: '10.10.10.1', hostname: 'some', aliases: []}, 0);
		await expect(linuxHosts.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxHostsFile: hosts might have been changed since the entry was read');
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
		await unlink('./test/hosts');
	});
});
