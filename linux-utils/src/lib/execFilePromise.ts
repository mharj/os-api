import {execFile} from 'child_process';

export function execFilePromise(cmd: string, args: string[], input?: Buffer): Promise<Buffer> {
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
