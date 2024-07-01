import {ILoggerLike} from '@avanio/logger-like';

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
	sudoPath?: string;
}

export function sudoArgs(args: string[], options: ILinuxSudoOptions) {
	if (process.platform === 'win32') {
		throw new Error('sudo not supported on Windows');
	}
	const sudoPath = options.sudoPath || '/usr/bin/sudo';
	if (options.sudoUser) {
		return [sudoPath, '-n', '-u', options.sudoUser, ...args];
	}
	return [sudoPath, '-n', ...args];
}
