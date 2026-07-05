export function isWindowsPlatform(): boolean {
	return process.platform === 'win32';
}

export function assertWindowPlatform(message?: string): void {
	if (process.platform !== 'win32') {
		throw new Error(message || 'not supported on Posix');
	}
}
