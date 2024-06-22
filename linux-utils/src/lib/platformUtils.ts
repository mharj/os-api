export function assertNotWindowPlatform(message?: string): void {
	if (process.platform === 'win32') {
		throw new Error(message || 'not supported on Windows');
	}
}
