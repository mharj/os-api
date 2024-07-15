/* eslint-disable no-unused-expressions */
import 'mocha';
import * as chai from 'chai';
import {getLsbRelease, lsbReleaseKeys} from '../src/';
import {z} from 'zod';

const expect = chai.expect;

const lsbSchema = z.record(z.enum(lsbReleaseKeys), z.string());

describe('Lsb Utils', function () {
	it('should get valid Lsb release data', async function () {
		expect(lsbSchema.safeParse(await getLsbRelease()).success).to.be.true;
	});
});
