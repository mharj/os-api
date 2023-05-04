process.env.NODE_ENV = 'test';
import {copyFile} from 'fs/promises';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';
import {isSesrivceStateError} from '@avanio/os-api-shared/types/service';
import {IHostEntry, LinuxHostsDb} from '../src';

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: IHostEntry = {
	address: '192.168.0.1',
	hostname: 'test',
	aliases: ['test'],
};

let linuxHosts: LinuxHostsDb;

describe('linux hosts db API', () => {
	before(async function () {
		linuxHosts = new LinuxHostsDb({file: './test/hosts.db', sudo: true});
		const status = await linuxHosts.status();
		if (isSesrivceStateError(status)) {
			console.log(status.errors);
			return this.skip();
		}
		return;
	});
	beforeEach(async () => {
		await copyFile('./test/hosts.test.db', './test/hosts.db');
	});
	it('should list hosts entries', async () => {
		let data = await linuxHosts.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['line', 'address', 'hostname', 'aliases']));
	});
	it('should add valid entry', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({line: testEntry.line, ...testData});
	});
	it('should fail to add no IP arress to file', async () => {
		await expect(linuxHosts.add({address: 'abc', hostname: 'abc', aliases: []})).to.be.eventually.rejectedWith(TypeError, 'Invalid IP address value: abc');
	});
	it('should fail to add non-valid hostname to file', async () => {
		await expect(linuxHosts.add({address: '127.0.0.1', hostname: 'ABC[]', aliases: []})).to.be.eventually.rejectedWith(
			TypeError,
			'Invalid hostname value: ABC[]',
		);
	});
	it('should fail to add non-valid host alias to file', async () => {
		await expect(linuxHosts.add({address: '127.0.0.1', hostname: 'localhost', aliases: ['ABC[]']})).to.be.eventually.rejectedWith(
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
		await linuxHosts.add({address: '10.10.10.1', hostname: 'some', aliases: []});
		await expect(linuxHosts.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'Hostfile might have been changed since the entry was read');
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
});
