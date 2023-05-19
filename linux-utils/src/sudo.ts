import {execFile, execFileSync} from 'child_process';
import {ILoggerLike} from '@avanio/logger-like';

let sudoFileLogger: ILoggerLike | undefined;

export function setSudoFileLogger(logger: ILoggerLike) {
	sudoFileLogger = logger;
}

function execFilePromise(cmd: string, args: string[], input?: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const child = execFile(cmd, args, (error, stdout) => {
			if (error) {
				reject(error);
			} else {
				resolve(Buffer.from(stdout));
			}
		});
		if (input) {
			child.stdin?.write(input);
		}
		child.stdin?.end();
	});
}

export interface ILinuxSudoOptions {
	sudo?: boolean;
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
