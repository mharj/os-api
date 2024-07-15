/* eslint-disable sonarjs/no-duplicate-string */
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {getEnt} from '../src';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('getEnt Tests', function () {
	it('get all passwd data', async function () {
		const passwdData = (await getEnt('passwd')).split('\n');
		expect(passwdData.length).to.be.greaterThan(0);
	});
	it('get root passwd data', async function () {
		const rootPasswdData = (await getEnt('passwd', 'root')).split('\n');
		expect(rootPasswdData.length).to.be.equal(1);
	});
	it('get root passwd data, target only files', async function () {
		const rootPasswdData = (await getEnt('passwd', 'root', {service: 'files'})).split('\n');
		expect(rootPasswdData.length).to.be.equal(1);
	});
	it('get root passwd data, target only files (with sudo)', async function () {
		const rootPasswdData = (await getEnt('passwd', 'root', {service: 'files', sudo: true})).split('\n');
		expect(rootPasswdData.length).to.be.equal(1);
	});
	it('it should not find root account from nis service', async function () {
		await expect(getEnt('passwd', 'root', {service: 'nis'})).to.be.eventually.rejectedWith(
			'getEnt: One or more supplied key could not be found in the database.',
		);
	});
});
