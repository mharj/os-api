export function isPosixPlatform(): boolean {
	return process.platform !== 'win32';
}

export function assertPosixPlatform(message?: string): void {
	if (process.platform === 'win32') {
		throw new Error(message || 'not supported on Windows');
	}
}
