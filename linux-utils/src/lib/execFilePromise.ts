import {execFile, type ExecFileException} from 'child_process';
import {getSudoFileLogger, type ILinuxSudoOptions, sudoArgs} from './sudoUtils';

export function isExecFileException(error: unknown): error is ExecFileException {
	return error instanceof Error && 'cmd' in error;
}

function handleExecFilePromise(cmd: string, args: string[], input?: Buffer): Promise<Buffer> {
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

export type ExecFilePromiseOptions = {
	logFuncName?: string;
} & ILinuxSudoOptions;

export function execFilePromise(cmd: string, args: string[], input?: Buffer, opts: ExecFilePromiseOptions = {}): Promise<Buffer> {
	if (opts.sudo) {
		const [sudoCmd, ...sudoArgList] = sudoArgs([cmd, ...args], opts);
		if (opts.logFuncName) {
			getSudoFileLogger()?.debug(opts.logFuncName, [sudoCmd, ...sudoArgList]);
		}
		return handleExecFilePromise(sudoCmd, sudoArgList, input);
	}
	return handleExecFilePromise(cmd, args, input);
}
