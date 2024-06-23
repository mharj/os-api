/* eslint-disable sonarjs/no-duplicate-string */
import 'mocha';
import * as chai from 'chai';
import {buildMakeDBParams} from '../src/makeDb';
const expect = chai.expect;

describe('Test', function () {
	it('should test maked args build with sudo', function () {
		const {cmd, args} = buildMakeDBParams(['-u', '/tmp/file'], {makedb: '/usr/bin/makedb', sudo: true, sudoPath: '/usr/bin/sudo', sudoUser: 'root'});
		expect(cmd).to.equal('/usr/bin/sudo');
		expect(JSON.stringify(args)).to.deep.equal('["-u","root","-b","/usr/bin/makedb","--quiet","-u","/tmp/file"]');
	});
	it('should test maked args build without sudo', function () {
		const {cmd, args} = buildMakeDBParams(['-u', '/tmp/file'], {makedb: '/usr/bin/makedb', sudo: false, sudoPath: '/usr/bin/sudo', sudoUser: 'root'});
		expect(cmd).to.equal('/usr/bin/makedb');
		expect(JSON.stringify(args)).to.deep.equal('["--quiet","-u","/tmp/file"]');
	});
});
