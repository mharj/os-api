import {PathLike} from 'node:fs';

/**
 * Build a string from a PathLike
 * @param {PathLike} pathLike - The path to convert
 * @returns {string} - The string representation of the path
 */
export function pathLikeToString(pathLike: PathLike): string {
	if (pathLike instanceof URL) {
		return pathLike.pathname;
	}
	return typeof pathLike === 'string' ? pathLike : pathLike.toString();
}
