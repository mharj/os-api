/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {chmod, copyFile, stat, test, unlink} from '@avanio/os-api-linux-utils';
import {constants} from 'fs';
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

function modeAsOctal(octal: bigint): bigint {
	return octal & 0o777n;
}

let haveSudo = false;

describe('linux hosts db API', () => {
	before(async function () {
		// check if sudo command is available
		try {
			haveSudo = await test('/usr/bin/sudo', constants.F_OK);
			haveSudo = true;
		} catch (e) {
			haveSudo = false;
		}

		await copyFile('./test/files/hosts.test.db', './test/hosts.db', undefined, {sudo: haveSudo});
		linuxHosts = new LinuxHostsDb({
			file: './test/hosts.db',
			sudo: haveSudo,
			backup: true,
			backupFile: './test/hosts.db.bak',
			backupPermissions: {posixMode: 0o600},
		});
		const status = await linuxHosts.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/hosts.test.db', './test/hosts.db', undefined, {sudo: haveSudo});
		await chmod('./test/hosts.db', 0o644, {sudo: haveSudo});
		if (await test('./test/hosts.db.bak', constants.F_OK, {sudo: haveSudo})) {
			await unlink('./test/hosts.db.bak', {sudo: haveSudo});
		}
	});
	it('should list hosts entries', async () => {
		const data = await linuxHosts.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['line', 'address', 'hostname', 'aliases', 'comment']));
		expect(await test('./test/hosts.db.bak', constants.F_OK, {sudo: haveSudo})).to.be.eq(false);
	});
	it('should add valid entry', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({line: testEntry.line, ...testData, comment: undefined});
		expect(modeAsOctal((await stat('./test/hosts.db.bak', {sudo: haveSudo})).mode)).to.be.eq(0o600n);
	});
	it('should delete host entry from file', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxHosts.delete(testEntry)).to.be.eventually.eq(true);
		expect(modeAsOctal((await stat('./test/hosts.db.bak', {sudo: haveSudo})).mode)).to.be.eq(0o600n);
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
		expect(modeAsOctal((await stat('./test/hosts.db.bak', {sudo: haveSudo})).mode)).to.be.eq(0o600n);
	});
	it('should return false if deleting not existing entry', async () => {
		await linuxHosts.add(testData);
		const data = await linuxHosts.list();
		const testEntry = data.find((d) => d.address === testData.address);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxHosts.delete({line: 9999, address: '10.10.10.10', hostname: 'asd', aliases: []})).to.be.eventually.eq(false);
		expect(modeAsOctal((await stat('./test/hosts.db.bak', {sudo: haveSudo})).mode)).to.be.eq(0o600n);
	});
	after(async () => {
		await unlink('./test/hosts.db', {sudo: haveSudo});
		await unlink('./test/hosts.db.bak', {sudo: haveSudo});
	});
});
