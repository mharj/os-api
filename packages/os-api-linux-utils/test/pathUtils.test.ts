import {describe, expect, it} from 'vitest';
import {pathLikeToString} from '../src/lib/pathUtils';

describe('Test', function () {
	it('should', function () {
		expect(pathLikeToString(new URL('file:///etc/passwd'))).to.equal('/etc/passwd');
	});
});
