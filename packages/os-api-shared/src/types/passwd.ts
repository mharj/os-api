export type LinuxPasswordType = 'shadow' | 'sha512' | 'sha256' | 'md5' | 'bcrypt' | 'des' | 'empty';
export type LinuxSha512Crypt = `$6$${string}$${string}`;
export type LinuxSha256Crypt = `$5$${string}$${string}`;
export type LinuxMd5Crypt = `$1$${string}$${string}`;
export type LinuxBcryptCrypt = `$2$${string}$${string}`;
export type LinuxBcryptCryptA = `$2a$${string}$${string}`;
export type LinuxBcryptCryptB = `$2b$${string}$${string}`;
export type LinuxDesCrypt = string;
export type LinuxShadowPassword = `x`;

export type LinuxPasswordCrypt =
	| LinuxShadowPassword
	| LinuxDesCrypt
	| LinuxBcryptCrypt
	| LinuxBcryptCryptA
	| LinuxBcryptCryptB
	| LinuxMd5Crypt
	| LinuxSha256Crypt
	| LinuxSha512Crypt;
