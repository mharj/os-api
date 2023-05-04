process.env.NODE_ENV = 'test';
import * as fs from 'fs';
import * as chai from 'chai';
import 'mocha';
import {writeFile, readFile, deleteFile} from '../src';

const expect = chai.expect;

describe('linux utils', () => {
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
