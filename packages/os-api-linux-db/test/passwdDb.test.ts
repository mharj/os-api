import {chmod, copyFile, test, unlink} from '@avanio/os-api-linux-utils';
import type {PasswordEntry} from '@avanio/os-api-shared';
import {constants, existsSync} from 'fs';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {LinuxPasswdDb} from '../src';
import {testPermissionBuilder} from './lib/stat';
import {osHaveSudo} from './lib/sudo';

const testData: PasswordEntry = {
	username: 'test',
	password: 'x',
	uid: 1000,
	gid: 1000,
	gecos: 'test user',
	home: '/home/test',
	shell: '/bin/bash',
};

let dbClass: LinuxPasswdDb;
let haveSudo = false;
const file = './packages/os-api-linux-db/test/passwd.db';
const backupFile = './packages/os-api-linux-db/test/passwd.db.bak';
const backupPermissions = {posixMode: 0o600} as const;

const basePath = './packages/os-api-linux-db/test/files/';

let testPermission: ReturnType<typeof testPermissionBuilder>;

describe('linux passwd db API', {skip: !existsSync('/usr/bin/makedb')}, () => {
	beforeAll(async function () {
		haveSudo = await osHaveSudo();
		testPermission = testPermissionBuilder(backupFile, {sudo: haveSudo}); // setup permission test
		await copyFile(`${basePath}passwd.test.db`, file, undefined, {sudo: haveSudo});
		dbClass = new LinuxPasswdDb({file, backup: true, backupFile, sudo: haveSudo, backupPermissions, logger: console});
		const status = await dbClass.status();
		if (status.status === 'error') {
			console.log(status);
		}
	});
	beforeEach(async () => {
		await copyFile(`${basePath}passwd.test.db`, file, undefined, {sudo: haveSudo});
		await chmod(file, 0o644, {sudo: haveSudo});
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
	it('should list entries', async () => {
		const data = await dbClass.list();
		expect(data).to.be.an('array');
		for (const d of data) {
			expect(d).to.have.all.keys('username', 'password', 'uid', 'gid', 'gecos', 'home', 'shell', '_idx');
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
		const dataArray = await dbClass.list();
		let value = dataArray.find((d) => d.username === 'root');
		expect(value?.home).to.be.eq('/root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(await dbClass.replace(value, {...value, home: '/home/root'})).to.be.eq(true);
		value = (await dbClass.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(value.home).to.be.eq('/home/root');
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should fail to add not valid entry to file', async () => {
		await expect(dbClass.add({...testData, username: 'äöäöä'}, 999)).rejects.toThrow(
			'Invalid passwd entry: "username" contains invalid characters. {"username":"äöäöä","password":"x","uid":1000,"gid":1000,"gecos":"test user","home":"/home/test","shell":"/bin/bash"}',
		);
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
		await dbClass.add({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash'});
		await expect(dbClass.delete(testEntry)).rejects.toThrow('LinuxPasswdDb: might have been changed since the entry was read');
		await expect(testPermission(backupPermissions.posixMode)).resolves.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).resolves.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(
			dbClass.delete({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash', _idx: 999}),
		).resolves.eq(false);
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
