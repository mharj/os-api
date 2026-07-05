import {describe, expect, it} from 'vitest';
import {assertSudo, isWindowsPlatform} from '../src/';

describe('sudo Tests', {skip: isWindowsPlatform()}, function () {
	it('should check sudo binary and not throw', function () {
		expect(() => assertSudo()).to.not.throw();
	});
});
