export type HostEntry = {
	address: string;
	hostname: string;
	aliases: string[];
	comment?: string;
};

export type HostFileEntry = HostEntry & {
	line: number;
};
