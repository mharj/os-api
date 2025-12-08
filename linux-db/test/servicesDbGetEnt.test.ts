/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';
import {getEnt, test, unlink} from '@avanio/os-api-linux-utils';
import {constants} from 'fs';
import {LinuxServicesDb} from '../src';
import {osHaveSudo} from './lib/sudo';
import {type ServicesEntry} from '@avanio/os-api-shared';

dotenv.config();

const expect = chai.expect;

chai.use(chaiAsPromised);

const testData: ServicesEntry = {
	service: 'unittest',
	port: 1234,
	protocol: 'tcp',
	aliases: ['test'],
	comment: 'test comment',
};

let dbClass: LinuxServicesDb;
let haveSudo = false;
const file = '/var/lib/misc/services.db';
const backupFile = '/var/lib/misc/services.db.bak';
const backupPermissions = {posixMode: 0o600} as const;

describe('linux services db with getent', () => {
	before(async function () {
		haveSudo = await osHaveSudo();
		if (!haveSudo || process.env.RUN_GETENT_TEST !== 'true') {
			this.skip();
		}
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
		dbClass = new LinuxServicesDb({
			file,
			sudo: haveSudo,
			backup: true,
			backupFile,
			backupPermissions,
		});
		await expect(dbClass.createDatabase()).to.be.eventually.eq(true);
		const status = await dbClass.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
		await expect(dbClass.createDatabase()).to.be.eventually.eq(true);
	});
	it('should add valid entry', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({_idx: testEntry._idx, ...testData});
		console.log(await getEnt('services', undefined, {service: 'db'}));
		await expect(getEnt('services', testData.service, {service: 'db'})).to.be.eventually.eq('unittest              1234/tcp test');
	});
	it('should list hosts entries', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		expect(data).to.be.an('array').and.lengthOf.at.least(1);
		data.forEach((d) => expect(d).to.have.all.keys(['_idx', 'service', 'port', 'protocol', 'aliases', 'comment']));
		expect(await test(backupFile, constants.F_OK, {sudo: haveSudo})).to.be.eq(true);
	});
	it('should delete host entry from file', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete(testEntry)).to.be.eventually.eq(true);
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
	});
	it('should return false if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete({_idx: 9999, service: 'another', port: 4567, protocol: 'tcp', aliases: []})).to.be.eventually.eq(false);
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
		await dbClass.deleteDatabase();
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
});
