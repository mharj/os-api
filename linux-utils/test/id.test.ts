/* eslint-disable sonarjs/no-duplicate-string */
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {posixAccountId, posixAccountName, posixGroupId, posixGroupName} from '../src/';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('ID Tests', function () {
	it('get Account ID', async function () {
		await expect(posixAccountId('root')).to.be.eventually.equal(0n);
		await expect(posixAccountId(0)).to.be.eventually.equal(0n);
		await expect(posixAccountId(0n)).to.be.eventually.equal(0n);
		await expect(posixAccountId('nobody')).to.be.eventually.equal(65534n);
		await expect(posixAccountId('does-not-exists')).to.be.rejectedWith('Command failed: id -u does-not-exists\nid: ‘does-not-exists’: no such user');
	});
	it('get Account Name', async function () {
		await expect(posixAccountName('root')).to.be.eventually.equal('root');
		await expect(posixAccountName(0)).to.be.eventually.equal('root');
		await expect(posixAccountName(65534)).to.be.eventually.equal('nobody');
		await expect(posixAccountName(65534n)).to.be.eventually.equal('nobody');
		await expect(posixAccountName('does-not-exists')).to.be.rejectedWith('Command failed: id -nu does-not-exists\nid: ‘does-not-exists’: no such user');
	});
	it('get Group ID', async function () {
		await expect(posixGroupId('root')).to.be.eventually.equal(0n);
		await expect(posixGroupId(0)).to.be.eventually.equal(0n);
		await expect(posixGroupId(0n)).to.be.eventually.equal(0n);
		await expect(posixGroupId('nobody')).to.be.eventually.equal(65534n);
		await expect(posixGroupId('does-not-exists')).to.be.rejectedWith('Command failed: id -g does-not-exists\nid: ‘does-not-exists’: no such user');
	});
	it('get Group Name', async function () {
		await expect(posixGroupName('root')).to.be.eventually.equal('root');
		await expect(posixGroupName(0)).to.be.eventually.equal('root');
		await expect(posixGroupName(65534)).to.be.eventually.equal('nogroup');
		await expect(posixGroupName(65534n)).to.be.eventually.equal('nogroup');
		await expect(posixGroupName('does-not-exists')).to.be.rejectedWith('Command failed: id -ng does-not-exists\nid: ‘does-not-exists’: no such user');
	});
});
