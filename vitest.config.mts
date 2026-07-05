import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		reporters: ['minimal', 'github-actions'],
		globals: true,
		environment: 'node',
		include: ['packages/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcovonly'],
			include: ['packages/**/*.ts'],
			exclude: ['packages/**/dist/**', 'packages/**/*-d.ts'],
		},
		typecheck: {
			include: ['packages/**/*.test-d.ts'],
		},
	},
	resolve: {
		tsconfigPaths: true,
	},
});
