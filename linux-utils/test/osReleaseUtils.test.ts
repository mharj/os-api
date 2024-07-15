/* eslint-disable no-unused-expressions */
import 'mocha';
import * as chai from 'chai';
import {getOsRelease, osReleaseKeys} from '../src/';
import {z} from 'zod';

const expect = chai.expect;

const osReleaseSchema = z.record(z.enum(osReleaseKeys), z.string());

describe('Os Release utils', function () {
	it('should', async function () {
		expect(osReleaseSchema.safeParse(await getOsRelease()).success).to.be.true;
	});
});
