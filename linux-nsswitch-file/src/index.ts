export interface INssEntry {
	name: string;
	sources: string[];
}

export interface INssFileEntry extends INssEntry  {
	line: number;
}

