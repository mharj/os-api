import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {getOsRelease, isWindowsPlatform, osReleaseKeys} from '../src/';

const osReleaseSchema = z.record(z.enum(osReleaseKeys), z.string());

describe('Os Release utils', {skip: isWindowsPlatform()}, function () {
	it('should', async function () {
		expect(osReleaseSchema.safeParse(await getOsRelease()).success).to.be.true;
	});
});
