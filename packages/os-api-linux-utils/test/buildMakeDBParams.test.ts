import {describe, expect, it} from 'vitest';
import {buildMakeDBParams} from '../src/makeDb';

describe('Test', function () {
	it('should test maked args build', function () {
		const [cmd, ...args] = buildMakeDBParams(['-u', '/tmp/file'], {makedb: '/usr/bin/makedb'});
		expect(cmd).to.equal('/usr/bin/makedb');
		expect(JSON.stringify(args)).to.deep.equal('["--quiet","-u","/tmp/file"]');
	});
});
