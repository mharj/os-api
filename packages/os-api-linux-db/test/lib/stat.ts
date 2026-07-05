import {type ILinuxSudoOptions, stat} from '@avanio/os-api-linux-utils';

function modeAsOctal(octal: bigint): bigint {
	return octal & 0o777n;
}

export function testPermissionBuilder(file: string, sudoProps: ILinuxSudoOptions = {}) {
	return async (octal: bigint | number): Promise<boolean> => {
		const fsStats = await stat(file, sudoProps);
		return modeAsOctal(fsStats.mode) === BigInt(octal);
	};
}
