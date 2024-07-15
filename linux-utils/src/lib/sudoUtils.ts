import * as fs from 'fs';
import {access} from '../access';
import {assertPosixPlatform} from './platform';
import {type ILoggerLike} from '@avanio/logger-like';

let sudoFileLogger: ILoggerLike | undefined;

export function setSudoFileLogger(logger: ILoggerLike) {
	sudoFileLogger = logger;
}

export function getSudoFileLogger(): ILoggerLike | undefined {
	return sudoFileLogger;
}

export interface ILinuxSudoOptions {
	/**
	 * Use sudo
	 */
	sudo?: boolean;
	/**
	 * User to sudo as, defaults to root
	 */
	sudoUser?: string;
	/**
	 * Path to sudo binary, defaults to /usr/bin/sudo
	 */
	sudoPath?: string;
}

function getSudoPath(options: ILinuxSudoOptions = {}): string {
	return options.sudoPath || '/usr/bin/sudo';
}

/**
 * Asserts that sudo command is available and executable
 */
export async function assertSudo(options: ILinuxSudoOptions = {}): Promise<void> {
	assertPosixPlatform('sudo is not supported on Windows');
	if (options.sudo) {
		await access(getSudoPath(options), fs.constants.X_OK);
	}
}

export function sudoArgs(args: string[], options: ILinuxSudoOptions): [string, string, ...string[]] {
	assertSudo();
	const sudoPath = getSudoPath(options);
	if (options.sudoUser) {
		return [sudoPath, '-n', '-u', options.sudoUser, ...args];
	}
	return [sudoPath, '-n', ...args];
}
