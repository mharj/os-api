import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {assertSudo, isWindowsPlatform} from '../src/';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('sudo Tests', function () {
	before(function () {
		if (isWindowsPlatform()) {
			this.skip();
		}
	});
	it('should check sudo binary and not throw', function () {
		expect(() => assertSudo()).to.not.throw();
	});
});
