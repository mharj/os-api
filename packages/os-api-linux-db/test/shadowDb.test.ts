import {LogLevel} from '@avanio/logger-like';
import {chmod, copyFile, test, unlink} from '@avanio/os-api-linux-utils';
import type {ShadowEntry} from '@avanio/os-api-shared';
import {constants, existsSync} from 'fs';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {LinuxShadowDb} from '../src';
import {testPermissionBuilder} from './lib/stat';
import {osHaveSudo} from './lib/sudo';

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

let dbClass: LinuxShadowDb;
let haveSudo = false;

const file = './test/shadow.db';
const backupFile = './test/shadow.db.bak';
const backupPermissions = {posixMode: 0o600} as const;

let testPermission: ReturnType<typeof testPermissionBuilder>;

describe('linux shadow db API', {skip: !existsSync('/usr/bin/makedb')}, () => {
	beforeAll(async function () {
		haveSudo = await osHaveSudo();
		testPermission = testPermissionBuilder(backupFile, {sudo: haveSudo}); // setup permission test
		await copyFile('./test/files/shadow.test.db', file, undefined, {sudo: haveSudo});
		dbClass = new LinuxShadowDb({file, backup: true, backupFile, sudo: haveSudo, backupPermissions});
		const status = await dbClass.status();
		if (status.status === 'error') {
			console.log(status);
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/shadow.test.db', file, undefined, {sudo: haveSudo});
		await chmod(file, 0o644, {sudo: haveSudo});
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
	it('should list entries', async () => {
		const data = await dbClass.list();
		expect(data).to.be.an('array');
		for (const d of data) {
			expect(d).to.have.all.keys('username', 'password', 'changed', 'min', 'max', 'warn', 'inactive', 'expire', 'reserved', '_idx');
		}
		await expect(test(backupFile, constants.R_OK, {sudo: true})).resolves.eq(false); // no write yet
	});
	it('should add valid entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		expect(testEntry).to.deep.equal({_idx: testEntry?._idx, ...testData});
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should modify entry', async () => {
		let value = (await dbClass.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		dbClass.setLogger(console);
		dbClass.allLogMapSet(LogLevel.Debug);

		await expect(dbClass.replace(value, {...value, changed: 16194})).resolves.eq(true);
		dbClass.allLogMapReset();
		dbClass.setLogger(undefined);
		value = (await dbClass.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		console.log(value);
		expect(value.changed).to.be.eq(16194);
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should fail to add not valid entry to file', async () => {
		await expect(dbClass.add({...testData, username: 'äöäöä'}, 999)).rejects.toThrow(TypeError);
		await expect(test(backupFile, constants.R_OK, {sudo: true})).resolves.eq(false); // no write yet
	});
	it('should delete entry from file', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete(testEntry)).resolves.eq(true);
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete({...testEntry, _idx: 999999})).rejects.toThrow('LinuxShadowDb: might have been changed since the entry was read');
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should thow if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete({username: 'test2', password: 'x', changed: 16193, min: 0, max: 9999, warn: 7, _idx: 999})).rejects.toThrow(
			'Error: LinuxShadowDb: Current entry does not exist',
		);
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
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
