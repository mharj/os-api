/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {copyFile, unlink} from 'fs/promises';
import {existsSync} from 'fs';
import {LinuxPasswd} from '../src';
import {PasswordEntry} from '@avanio/os-api-shared';

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

const file = './test/passwd';
const backupFile = './test/passwd.bak';

let linuxPasswd: LinuxPasswd;

describe('linux passwd file API', () => {
	before(() => {
		linuxPasswd = new LinuxPasswd({file, backupFile, backup: true});
	});
	beforeEach(async () => {
		await copyFile('./test/passwd.test', file);
		unlink(backupFile);
	});
	it('should list entries', async () => {
		const data = await linuxPasswd.list();
		expect(data).to.be.an('array');
		data.forEach((d) => expect(d).to.have.all.keys(['username', 'password', 'uid', 'gid', 'gecos', 'home', 'shell', 'line']));
		expect(existsSync(backupFile)).to.be.eq(false); // no write yet
	});
	it('should add valid entry to EOF', async () => {
		await linuxPasswd.add(testData);
		const data = await linuxPasswd.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should add valid entry middle of file', async () => {
		await linuxPasswd.add(testData, 4);
		const data = await linuxPasswd.list();
		expect(data.find((d) => d.line === 4)).to.deep.equal({line: 4, ...testData});
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
	it('should add valid entry to EOF if index is bigger than array length', async () => {
		await linuxPasswd.add(testData, 999);
		const data = await linuxPasswd.list();
		const testEntry = data[data.length - 1];
		expect(data[data.length - 1]).to.deep.equal({line: testEntry?.line, ...testData});
		expect(existsSync(backupFile)).to.be.eq(true);
	});
	it('should fail to add not valid entry to file', async () => {
		await expect(linuxPasswd.add({...testData, username: 'äöäöä'}, 999)).to.be.eventually.rejectedWith(TypeError);
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
		await linuxPasswd.add({username: 'test2', password: 'x', uid: 1000, gid: 1000, gecos: 'test user', home: '/home/test', shell: '/bin/bash'}, 4);
		await expect(linuxPasswd.delete(testEntry)).to.be.eventually.rejectedWith(Error, 'LinuxPasswdFile: might have been changed since the entry was read');
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
