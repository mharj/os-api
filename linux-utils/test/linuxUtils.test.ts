/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable import/first */
process.env.NODE_ENV = 'test';
import 'mocha';
import * as chai from 'chai';
import * as fs from 'fs';
import {deleteFile, deleteFilePromise, readFile, readFilePromise, writeFile, writeFilePromise} from '../src';

const expect = chai.expect;

describe('linux utils', () => {
	describe('sync', () => {
		it('should write text file', async () => {
			writeFile('./test.txt', Buffer.from('demo'), {sudo: true});
			expect(fs.existsSync('./test.txt')).to.be.eq(true);
		});
		it('should read text file', async () => {
			expect(readFile('./test.txt', {sudo: true}).toString()).to.be.eq('demo');
		});
		it('should delete text file', async () => {
			deleteFile('./test.txt', {sudo: true});
			expect(fs.existsSync('./test.txt')).to.be.eq(false);
		});
	});
	describe('async', () => {
		it('should write text file', async () => {
			await writeFilePromise('./test.txt', Buffer.from('demo'), {sudo: true});
			expect(fs.existsSync('./test.txt')).to.be.eq(true);
		});
		it('should read text file', async () => {
			expect((await readFilePromise('./test.txt', {sudo: true})).toString()).to.be.eq('demo');
		});
		it('should delete text file', async () => {
			await deleteFilePromise('./test.txt', {sudo: true});
			expect(fs.existsSync('./test.txt')).to.be.eq(false);
		});
	});
});
