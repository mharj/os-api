import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {getLsbRelease, isWindowsPlatform, lsbReleaseKeys} from '../src/';

const lsbSchema = z.record(z.enum(lsbReleaseKeys), z.string());

describe('Lsb Utils', {skip: isWindowsPlatform()}, function () {
	it('should get valid Lsb release data', async function () {
		expect(lsbSchema.safeParse(await getLsbRelease()).success).to.be.true;
	});
});
