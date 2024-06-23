/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {existsSync} from 'fs';
import {LinuxPasswdDb} from '../src';
import {type PasswordEntry} from '@avanio/os-api-shared';

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

const file = './test/passwd.db';
const backupFile = './test/passwd.db.bak';

let linuxPasswd: LinuxPasswdDb;

describe('linux hosts db API', () => {
	before(async function () {
		await copyFile('./test/files/passwd.test.db', file);
		linuxPasswd = new LinuxPasswdDb({file, backup: true, backupFile, sudo: true});
		const status = await linuxPasswd.status();
		if (status.status === 'error') {
			console.log(status);
			this.skip();
		}
	});
	beforeEach(async () => {
		await copyFile('./test/files/passwd.test.db', file);
		if (existsSync(backupFile)) {
			await unlink(backupFile);
		}
	});
	it('should list entries', async () => {
		const data = await linuxPasswd.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['username', 'password', 'uid', 'gid', 'gecos', 'home', 'shell', 'line']));
		expect(existsSync(backupFile)).to.be.eq(false); // no write yet
	});
	it('should add valid entry', async () => {
		await linuxPasswd.add(testData);
		const data = await linuxPasswd.list();
		const testEntry = data.find((d) => d.username === testData.username);
		expect(testEntry).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should modify entry', async () => {
		let value = (await linuxPasswd.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxPasswd.replace(value, {...value, home: '/home/root'});
		value = (await linuxPasswd.list()).find((d) => d.username === 'root');
		if (!value) {
			throw new Error('Fatal: Test entry not found');
		}
		expect(value.home).to.be.eq('/home/root');
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should fail to add not valid entry to file', async () => {
		await expect(linuxPasswd.add({...testData, username: 'äöäöä'}, 999)).to.be.eventually.rejectedWith(
			TypeError,
			'Invalid passwd entry: "username" contains invalid characters. {"username":"äöäöä","password":"x","uid":1000,"gid":1000,"gecos":"test user","home":"/home/test","shell":"/bin/bash"}',
		);
		expect(existsSync(backupFile)).to.be.eq(false); // no write yet
	});
	it('should delete entry from file', async () => {
		await linuxPasswd.add(testData);
		const data = await linuxPasswd.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(linuxPasswd.delete(testEntry)).to.be.eventually.eq(true);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should fail to delete from file if cant find line from correct location', async () => {
		await linuxPasswd.add(testData);
		const data = await linuxPasswd.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await linuxPasswd.add({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash'});
		await expect(linuxPasswd.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxPasswdDb: might have been changed since the entry was read');
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should return false if deleting not existing entry', async () => {
		await linuxPasswd.add(testData);
		const data = await linuxPasswd.list();
		const testEntry = data.find((d) => d.username === testData.username);
		if (!testEntry) {
			throw new Error('Fatal: Test entry not found');
		}
		await expect(
			linuxPasswd.delete({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash', line: 999}),
		).to.be.eventually.eq(false);
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	after(async () => {
		await unlink(file);
		await unlink(backupFile);
	});
});
