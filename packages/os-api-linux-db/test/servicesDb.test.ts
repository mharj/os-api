import {chmod, copyFile, test, unlink} from '@avanio/os-api-linux-utils';
import type {ServicesEntry} from '@avanio/os-api-shared';
import {constants, existsSync} from 'fs';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {LinuxServicesDb} from '../src';
import {testPermissionBuilder} from './lib/stat';
import {osHaveSudo} from './lib/sudo';

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

describe('linux services db API', {skip: !existsSync('/usr/bin/makedb')}, () => {
	beforeAll(async function () {
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
		for (const d of data) {
			expect(d).to.have.all.keys(['_idx', 'service', 'port', 'protocol', 'aliases', 'comment']);
		}
		expect(await test(backupFile, constants.F_OK, {sudo: haveSudo})).to.be.eq(false);
	});
	it('should add valid entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(testEntry).to.deep.equal({_idx: testEntry._idx, ...testData, comment: undefined});
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should delete host entry from file', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete(testEntry)).resolves.eq(true);
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
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
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.service === testData.service);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete({_idx: 9999, service: 'another', port: 4567, protocol: 'tcp', aliases: []})).resolves.eq(false);
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
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
		if (await test(file, constants.F_OK, {sudo: haveSudo})) {
			await unlink(file, {sudo: haveSudo});
		}
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
});
