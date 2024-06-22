/* eslint-disable no-unused-expressions */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as fs from 'fs';
import {access, chmod, chown, copyFile, readFile, rename, stat, unlink, writeFile} from '../src';

const expect = chai.expect;

describe('linux utils', () => {
	it('should write text file', async () => {
		await writeFile('./test.txt', Buffer.from('demo'), {sudo: true});
		expect(fs.existsSync('./test.txt')).to.be.eq(true);
	});
	it('should read text file', async () => {
		expect((await readFile('./test.txt', {sudo: true})).toString()).to.be.eq('demo');
	});
	it('should access text file', async () => {
		expect(async () => await access('./test.txt', fs.constants.R_OK, {sudo: true})).not.to.throw;
		expect(async () => await access('./none.txt', fs.constants.R_OK, {sudo: true})).to.throw;
	});
	it('should get stats of text file', async () => {
		const linuxStats = await stat('./test.txt', {sudo: true});
		const nodeStats = await stat('./test.txt', {sudo: false});
		expect(linuxStats.mode).to.be.eq(nodeStats.mode);
		expect(linuxStats.uid).to.be.eq(nodeStats.uid);
		expect(linuxStats.gid).to.be.eq(nodeStats.gid);
	});
	it('should copy text file', async () => {
		await copyFile('./test.txt', './test.txt.backup', undefined, {sudo: true});
		expect(fs.existsSync('./test.txt.backup')).to.be.eq(true);
	});
	it('should change permissions', async () => {
		await chmod('./test.txt.backup', 0o444, {sudo: true});
		const linuxStats = await stat('./test.txt.backup', {sudo: true});
		expect(linuxStats.mode).to.be.eq(0o100444n);
	});
	it('should change owner and group', async () => {
		await chown('./test.txt.backup', 65534, 65534, {sudo: true});
		const linuxStats = await stat('./test.txt.backup', {sudo: true});
		expect(linuxStats.uid).to.be.eq(65534n);
		expect(linuxStats.gid).to.be.eq(65534n);
	});
	it('should rename text file', async () => {
		await copyFile('./test.txt', './test.txt.rename1', undefined, {sudo: true});
		await rename('./test.txt.rename1', './test.txt.rename2', {sudo: true});
		expect(fs.existsSync('./test.txt.rename1')).to.be.eq(false);
		expect(fs.existsSync('./test.txt.rename2')).to.be.eq(true);
		await unlink('./test.txt.rename2', {sudo: true});
		expect(fs.existsSync('./test.txt.rename2')).to.be.eq(false);
	});
	it('should remove text file', async () => {
		await unlink('./test.txt', {sudo: true});
		expect(fs.existsSync('./test.txt')).to.be.eq(false);
		await unlink('./test.txt.backup', {sudo: true});
		expect(fs.existsSync('./test.txt.backup')).to.be.eq(false);
	});
});
