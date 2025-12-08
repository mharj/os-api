/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {chmod, copyFile, test, unlink} from '@avanio/os-api-linux-utils';
import {constants} from 'fs';
import {LinuxServicesDb} from '../src';
import {osHaveSudo} from './lib/sudo';
import {type ServicesEntry} from '@avanio/os-api-shared';
import {testPermissionBuilder} from './lib/stat';

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: ServicesEntry = {
	service: 'unittest',
	port: 1234,
	protocol: 'tcp',
	aliases: ['test'],
};

let dbClass: LinuxServicesDb;
let haveSudo = false;
const file = './test/services.db';
const backupFile = './test/services.db.bak';
const backupPermissions = {posixMode: 0o600} as const;

let testPermission: ReturnType<typeof testPermissionBuilder>;

describe('linux services db API', () => {
	before(async function () {
		haveSudo = await osHaveSudo();
		testPermission = testPermissionBuilder(backupFile, {sudo: haveSudo}); // setup permission test
		await copyFile('./test/files/services.test.db', file, undefined, {sudo: haveSudo});
		dbClass = new LinuxServicesDb({
			file,
			sudo: haveSudo,
			backup: true,
			backupFile,
			backupPermissions,
		});
		const status = await dbClass.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/services.test.db', file, undefined, {sudo: haveSudo});
		await chmod(file, 0o644, {sudo: haveSudo});
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
	it('should list hosts entries', async () => {
		const data = await dbClass.list();
		expect(data).to.be.an('array').and.lengthOf.at.least(1);
		data.forEach((d) => expect(d).to.have.all.keys(['_idx', 'service', 'port', 'protocol', 'aliases', 'comment']));
		expect(await test(backupFile, constants.F_OK, {sudo: haveSudo})).to.be.eq(false);
	});
	it('should add valid entry', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({_idx: testEntry._idx, ...testData, comment: undefined});
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should delete host entry from file', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete(testEntry)).to.be.eventually.eq(true);
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.add({service: 'another', port: 1233, protocol: 'tcp', aliases: []})).to.be.eventually.eq(true);
		await expect(dbClass.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxServicesDb: might have been changed since the entry was read');
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete({_idx: 9999, service: 'another', port: 4567, protocol: 'tcp', aliases: []})).to.be.eventually.eq(false);
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should create empty database and delete it', async () => {
		await unlink(file, {sudo: haveSudo});
		await expect(dbClass.createDatabase()).to.be.eventually.eq(true);
		await expect(test(file, constants.F_OK, {sudo: haveSudo})).to.be.eventually.eq(true);
		const data = await dbClass.list();
		expect(data).to.be.an('array').and.lengthOf(0);
		await expect(dbClass.deleteDatabase()).to.be.eventually.eq(true);
		await expect(test(file, constants.F_OK, {sudo: haveSudo})).to.be.eventually.eq(false);
	});
	after(async () => {
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
});
