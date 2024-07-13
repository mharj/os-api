/* eslint-disable sort-keys */
import {describe, expect, it} from '@jest/globals';
import {parseServicesLine} from '../src/lib/servicesLineParser';
import {type ServiceEntry} from '../src/types/v1/servicesEntry';

type TestValue = {
	input: string;
	output: ServiceEntry | undefined;
};

const validTests: TestValue[] = [
	{
		input: 'netstat         15/tcp',
		output: {service: 'netstat', port: 15, protocol: 'tcp', aliases: [], comment: undefined},
	},
	{
		input: 'chargen         19/tcp          ttytst source',
		output: {service: 'chargen', port: 19, protocol: 'tcp', aliases: ['ttytst', 'source'], comment: undefined},
	},
	{
		input: 'spg             7016/tcp                # SPG Controls Carrier',
		output: {service: 'spg', port: 7016, protocol: 'tcp', aliases: [], comment: 'SPG Controls Carrier'},
	},
];

describe('parseServicesLine', function () {
	it('should parse valid lines', function () {
		validTests.forEach(({input, output}) => {
			const entry = parseServicesLine(input);
			expect(entry).not.toBeUndefined();
			expect(entry).toEqual(output);
		});
	});
});
