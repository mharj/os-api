import {getEnt, test, unlink} from '@avanio/os-api-linux-utils';
import type {ServicesEntry} from '@avanio/os-api-shared';
import {constants, existsSync} from 'fs';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {LinuxServicesDb} from '../src';
import {osHaveSudo} from './lib/sudo';

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

describe('linux services db with getent', {skip: !existsSync('/usr/bin/makedb')}, () => {
	beforeAll(async function () {
		haveSudo = await osHaveSudo();
		if (!haveSudo) {
			throw new Error('sudo is not available');
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
		await expect(dbClass.createDatabase()).resolves.eq(true);
		const status = await dbClass.status();
		if (status.status === 'error') {
			console.log(status);
		}
	});
	beforeEach(async () => {
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
		await expect(dbClass.createDatabase()).resolves.eq(true);
	});
	it('should add valid entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({_idx: testEntry._idx, ...testData});
		console.log(await getEnt('services', undefined, {service: 'db'}));
		await expect(getEnt('services', testData.service, {service: 'db'})).resolves.eq('unittest              1234/tcp test');
	});
	it('should list hosts entries', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		expect(data).to.be.an('array').and.lengthOf.at.least(1);
		for (const d of data) {
			expect(d).to.have.all.keys(['_idx', 'service', 'port', 'protocol', 'aliases', 'comment']);
		}
		expect(await test(backupFile, constants.F_OK, {sudo: haveSudo})).to.be.eq(true);
	});
	it('should delete host entry from file', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete(testEntry)).resolves.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.add({service: 'another', port: 1233, protocol: 'tcp', aliases: []})).resolves.eq(true);
		await expect(dbClass.delete(testEntry)).rejects.toThrow('LinuxServicesDb: might have been changed since the entry was read');
	});
	it('should return false if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete({_idx: 9999, service: 'another', port: 4567, protocol: 'tcp', aliases: []})).resolves.eq(false);
	});
	it('should create empty database and delete it', async () => {
		await unlink(file, {sudo: haveSudo});
		await expect(dbClass.createDatabase()).resolves.eq(true);
		await expect(test(file, constants.F_OK, {sudo: haveSudo})).resolves.eq(true);
		const data = await dbClass.list();
		expect(data).to.be.an('array').and.lengthOf(0);
		await expect(dbClass.deleteDatabase()).resolves.eq(true);
		await expect(test(file, constants.F_OK, {sudo: haveSudo})).resolves.eq(false);
	});
	afterAll(async () => {
		await dbClass.deleteDatabase();
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
});
