import { EdmSchema } from "./edmComplex";
import { Edm } from "./edmValue";

export type ErrorLike = {
	name: string;
	message: string;
	stack?: string;
};

export function toErrorLike(error: Error): ErrorLike {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
}


export const errorLikeSchema: EdmSchema<ErrorLike> = {
	name: {type: Edm.String, nullable: false},
	message: {type: Edm.String, nullable: false},
	stack: {type: Edm.String, nullable: true},
}