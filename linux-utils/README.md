# @avanio/os-api-linux-utils

This package provides file utilities for reading, writing, and deleting files on Linux. It also includes the option to perform these operations with sudo privileges.

## Installation

To install this package, run the following command:

```bash
npm install @avanio/os-api-linux-utils
```

## Usage
```typescript
// read file
const data: Buffer = readFile('/path/to/file', {sudo: true});
const data: Buffer = await readFilePromise('/path/to/file', {sudo: true});

// write file
writeFile('/path/to/file', Buffer.from('data'), {sudo: true});
await writeFilePromise('/path/to/file', Buffer.from('data'), {sudo: true});

// delete file
deleteFile('/path/to/file', {sudo: true});
await deleteFilePromise('/path/to/file', {sudo: true});

// logging sudo commands
setSudoFileLogger(console); // or log4js or winston or any ILoggerLike object
```
