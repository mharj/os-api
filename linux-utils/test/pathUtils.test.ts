import 'mocha';
import * as chai from 'chai';
import {pathLikeToString} from '../src/lib/pathUtils';

const expect = chai.expect;

describe('Test', function () {
	it('should', function () {
		expect(pathLikeToString(new URL('file:///etc/passwd'))).to.equal('/etc/passwd');
	});
});
