export function isLinuxPlatform(): boolean {
	return process.platform === 'linux';
}

export function assertLinuxPlatform(message?: string): void {
	if (!isLinuxPlatform()) {
		throw new Error(message || `not supported on ${process.platform}`);
	}
}
