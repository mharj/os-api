import {constants} from 'fs';
import {execFilePromise} from './execFilePromise';
import {execFileSync} from 'child_process';
import {ILoggerLike} from '@avanio/logger-like';

let sudoFileLogger: ILoggerLike | undefined;

export function setSudoFileLogger(logger: ILoggerLike) {
	sudoFileLogger = logger;
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

function sudoArgs(args: string[], options: ILinuxSudoOptions) {
	if (process.platform === 'win32') {
		throw new Error('sudo not supported on Windows');
	}
	const sudoPath = options.sudoPath || '/usr/bin/sudo';
	if (options.sudoUser) {
		return [sudoPath, '-n', '-U', options.sudoUser, ...args];
	}
	return [sudoPath, '-n', ...args];
}

function buildTestArg(mode?: number) {
	switch (mode) {
		case constants.X_OK:
			return '-x';
		case constants.W_OK:
			return '-w';
		case constants.R_OK:
			return '-r';
		case constants.F_OK:
		default:
			return '-e';
	}
}

export function sudoAccessFile(fileName: string, mode: number = constants.F_OK, options: ILinuxSudoOptions): void {
	const [cmd, ...args] = sudoArgs(['test', buildTestArg(mode), fileName], options);
	sudoFileLogger?.debug('sudoAccessFile:', cmd, args);
	execFileSync(cmd, args);
}

/**
 * Write file with sudo and tee
 */
export function sudoWriteFile(fileName: string, content: Buffer, options: ILinuxSudoOptions) {
	const [cmd, ...args] = sudoArgs(['tee', fileName], options);
	sudoFileLogger?.debug('sudoWriteFile:', cmd, args);
	execFileSync(cmd, args, {input: content});
}

/**
 * Read file with sudo and cat
 */
export function sudoReadFile(fileName: string, options: ILinuxSudoOptions): Buffer {
	const [cmd, ...args] = sudoArgs(['cat', fileName], options);
	sudoFileLogger?.debug('sudoReadFile:', cmd, args);
	return execFileSync(cmd, args);
}

/**
 * Delete file with sudo and rm
 */
export function sudoDeleteFile(fileName: string, options: ILinuxSudoOptions): void {
	const [cmd, ...args] = sudoArgs(['rm', '-f', fileName], options);
	sudoFileLogger?.debug('sudoDeleteFile:', cmd, args);
	execFileSync(cmd, args);
}

export async function sudoAccessFilePromise(fileName: string, mode: number = constants.F_OK, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['test', buildTestArg(mode), fileName], options);
	sudoFileLogger?.debug('sudoAccessFilePromise:', cmd, args);
	await execFilePromise(cmd, args);
}

/**
 * Async write file with sudo and tee
 */
export async function sudoWriteFilePromise(fileName: string, content: Buffer, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['tee', fileName], options);
	sudoFileLogger?.debug('sudoWriteFilePromise:', cmd, args);
	await execFilePromise(cmd, args, content);
}

/**
 * Async read file with sudo and cat
 */
export function sudoReadFilePromise(fileName: string, options: ILinuxSudoOptions): Promise<Buffer> {
	const [cmd, ...args] = sudoArgs(['cat', fileName], options);
	sudoFileLogger?.debug('sudoReadFilePromise:', cmd, args);
	return execFilePromise(cmd, args);
}

/**
 * Async delete file with sudo and rm
 */
export async function sudoDeleteFilePromise(fileName: string, options: ILinuxSudoOptions): Promise<void> {
	const [cmd, ...args] = sudoArgs(['rm', '-f', fileName], options);
	sudoFileLogger?.debug('sudoDeleteFilePromise:', cmd, args);
	await execFilePromise(cmd, args);
}
