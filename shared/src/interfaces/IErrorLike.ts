export interface IErrorLike {
	readonly name: string;
	readonly message: string;
	readonly stack?: string;
}
