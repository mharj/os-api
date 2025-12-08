/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {chmod, copyFile, test, unlink} from '@avanio/os-api-linux-utils';
import {constants} from 'fs';
import {LinuxPasswdDb} from '../src';
import {osHaveSudo} from './lib/sudo';
import {type PasswordEntry} from '@avanio/os-api-shared';
import {testPermissionBuilder} from './lib/stat';

const expect = chai.expect;

chai.use(chaiAsPromised);

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
const file = './test/passwd.db';
const backupFile = './test/passwd.db.bak';
const backupPermissions = {posixMode: 0o600} as const;

let testPermission: ReturnType<typeof testPermissionBuilder>;

describe('linux passwd db API', () => {
	before(async function () {
		haveSudo = await osHaveSudo();
		testPermission = testPermissionBuilder(backupFile, {sudo: haveSudo}); // setup permission test
		await copyFile('./test/files/passwd.test.db', file, undefined, {sudo: haveSudo});
		dbClass = new LinuxPasswdDb({file, backup: true, backupFile, sudo: haveSudo, backupPermissions, logger: console});
		const status = await dbClass.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/passwd.test.db', file, undefined, {sudo: haveSudo});
		await chmod(file, 0o644, {sudo: haveSudo});
		if (await test(backupFile, constants.F_OK, {sudo: haveSudo})) {
			await unlink(backupFile, {sudo: haveSudo});
		}
	});
	it('should list entries', async () => {
		const data = await dbClass.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['username', 'password', 'uid', 'gid', 'gecos', 'home', 'shell', '_idx']));
		await expect(test(backupFile, constants.R_OK, {sudo: true})).to.be.eventually.eq(false); // no write yet
	});
	it('should add valid entry', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		expect(testEntry).to.deep.equal({_idx: testEntry?._idx, ...testData});
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
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
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should fail to add not valid entry to file', async () => {
		await expect(dbClass.add({...testData, username: 'äöäöä'}, 999)).to.be.eventually.rejectedWith(
			TypeError,
			'Invalid passwd entry: "username" contains invalid characters. {"username":"äöäöä","password":"x","uid":1000,"gid":1000,"gecos":"test user","home":"/home/test","shell":"/bin/bash"}',
		);
		await expect(test(backupFile, constants.R_OK, {sudo: true})).to.be.eventually.eq(false); // no write yet
	});
	it('should delete entry from file', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(dbClass.delete(testEntry)).to.be.eventually.eq(true);
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await dbClass.add({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash'});
		await expect(dbClass.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxPasswdDb: might have been changed since the entry was read');
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await expect(dbClass.add(testData)).to.be.eventually.eq(true);
		const data = await dbClass.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(
			dbClass.delete({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash', _idx: 999}),
		).to.be.eventually.eq(false);
		await expect(testPermission(backupPermissions.posixMode)).to.be.eventually.eq(true);
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
