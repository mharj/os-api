import {HostEntry} from '../types/v1/hostEntry';
import type {ILoggerLike} from '@avanio/logger-like';
import {isIP} from 'net';

const isValidHostnameRegex = /^[a-z.\-0-9]+$/;
export function isValidHostname(hostname: string): boolean {
	return isValidHostnameRegex.test(hostname);
}

function splitString(value: string): [string, string | undefined] {
	const idx = value.indexOf('#');
	if (idx === -1) {
		return [value, undefined];
	}
	return [value.slice(0, idx), value.slice(idx + 1)];
}

/**
 * pre-validate line before parsing
 */
export function isValidLine(line: string): boolean {
	return line.trim().length > 0 && !line.startsWith('#');
}

/**
 * parse raw host line into HostEntry object with optional logger for error reporting
 */
export function parseHostLine(line: string, logger?: ILoggerLike): HostEntry | undefined {
	let [entry, comment] = splitString(line);
	if (!entry) {
		return undefined;
	}
	entry = entry.replace(/\s+/g, ' ').trim();
	comment = comment ? comment.replace(/#/, '').trim() : undefined;
	const parts = entry.split(/\s+/);
	const address = parts.shift();
	const hostname = parts.shift();
	const aliases = parts || [];
	if (!address || !hostname) {
		return undefined;
	}
	if (!isIP(address)) {
		logger?.info(`Invalid IP address: ${address}`);
		return undefined;
	}
	if (!isValidHostname(hostname)) {
		logger?.info(`Invalid hostname: ${hostname}`);
		return undefined;
	}
	return {address, aliases, comment, hostname};
}
