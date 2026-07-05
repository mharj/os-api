import {describe, expect, it} from 'vitest';
import {isWindowsPlatform, posixAccountId, posixAccountName, posixGroupId, posixGroupName} from '../src/';

describe('ID Tests', {skip: isWindowsPlatform()}, function () {
	it('get Account ID', async function () {
		await expect(posixAccountId('root')).resolves.toBe(0n);
		await expect(posixAccountId(0)).resolves.toBe(0n);
		await expect(posixAccountId(0n)).resolves.toBe(0n);
		await expect(posixAccountId('nobody')).resolves.toBe(65534n);
		await expect(posixAccountId('does-not-exists')).rejects.toThrow('Command failed: id -u does-not-exists\nid: ‘does-not-exists’: no such user');
	});
	it('get Account Name', async function () {
		await expect(posixAccountName('root')).resolves.toBe('root');
		await expect(posixAccountName(0)).resolves.toBe('root');
		await expect(posixAccountName(65534)).resolves.toBe('nobody');
		await expect(posixAccountName(65534n)).resolves.toBe('nobody');
		await expect(posixAccountName('does-not-exists')).rejects.toThrow('Command failed: id -nu does-not-exists\nid: ‘does-not-exists’: no such user');
	});
	it('get Group ID', async function () {
		await expect(posixGroupId('root')).resolves.toBe(0n);
		await expect(posixGroupId(0)).resolves.toBe(0n);
		await expect(posixGroupId(0n)).resolves.toBe(0n);
		await expect(posixGroupId('nobody')).resolves.toBe(65534n);
		await expect(posixGroupId('does-not-exists')).rejects.toThrow('Command failed: id -g does-not-exists\nid: ‘does-not-exists’: no such user');
	});
	it('get Group Name', async function () {
		await expect(posixGroupName('root')).resolves.toBe('root');
		await expect(posixGroupName(0)).resolves.toBe('root');
		await expect(posixGroupName(65534)).resolves.toBe('nogroup');
		await expect(posixGroupName(65534n)).resolves.toBe('nogroup');
		await expect(posixGroupName('does-not-exists')).rejects.toThrow('Command failed: id -ng does-not-exists\nid: ‘does-not-exists’: no such user');
	});
});
