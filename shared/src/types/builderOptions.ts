export type BuilderOptions = {
	useTabs?: boolean;
	spaceCount?: number;
	commentsDisabled?: boolean;
};

/** Whitespace character */
export function ws(options: BuilderOptions): string {
	return options.useTabs ? '\t' : ' '.repeat(options.spaceCount ?? 4);
}
