import * as defaultFs from 'fs-extra';
import * as minimatch from 'minimatch';
import * as os from 'os';
const isWin32 = os.platform() === 'win32';
import * as path from 'path';

import {
  globParent,
  globPart,
  isAbsolute,
  isGlob,
  resolvePattern,
  unixlike
} from './pattern';

export type FileCallback = (file: string) => string | void;
export type DirectoryCallback = (dir: string) => string | void;

export interface FSFileSystem {
  Dirent: typeof defaultFs.Dirent,
  opendir: typeof defaultFs.opendir;
  opendirSync: typeof defaultFs.opendirSync;
  readdir: typeof defaultFs.readdir;
  readdirSync: typeof defaultFs.readdirSync;
  statSync: typeof defaultFs.statSync;
  lstatSync: typeof defaultFs.lstatSync;
  readlinkSync: typeof defaultFs.readlinkSync;
}

export interface FSOptions {
  fs?: FSFileSystem;
  useNewAPI?: boolean;
  bufferSize?: number;
  followSymbolic?: boolean;
}

/**
 * Whether child is a sub directory of parent.
 * See https://stackoverflow.com/a/45242825/5906199.
 * @param {string} child Sub directory to test.
 * @param {string} parent The parent directory.
 * @return {Boolean}
 */
export function isSubDirectory(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function isValidFileSystem(fs: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(fs, 'opendir')
    && Object.prototype.hasOwnProperty.call(fs, 'opendirSync')
    && Object.prototype.hasOwnProperty.call(fs, 'readdir')
    && Object.prototype.hasOwnProperty.call(fs, 'readdirSync')
    && Object.prototype.hasOwnProperty.call(fs, 'statSync')
    && Object.prototype.hasOwnProperty.call(fs, 'lstatSync')
    && Object.prototype.hasOwnProperty.call(fs, 'readlinkSync');
}

/**
 * Async seprate the directories and files, the directory or file must be exist.
 * Note: separateFilesDirs is async but the fileCallback and dirCallback should be sync.  
 * If occurs an error, using `Promise.catch` handle it, e.g. `await separateFilesDirs(...).catch(err => { })`.  
 * @param {string[]} filesdirs List of directories and files.
 * @param {Function} [fileCallback] Called when occurs file, stop if return "done".
 * @param {Function} [dirCallback] Called when occurs directory, stop if return "done".
 * @param {FSOptions.fs} [options.fs] User provided file system, like the `memfs`, defaults to `fs-extra`.
 * @return {void}
 */
export async function separateFilesDirs(
  filesdirs: string[],
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = { fs: defaultFs }
): Promise<void> {
  const fs = (options && options.fs && isValidFileSystem(options.fs)) ? options.fs : defaultFs;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const p of (async function* (): AsyncGenerator<void, void, void> {
    for (const filedir of filesdirs) {
      const filedirAbs = path.resolve(filedir);
      // fs.statSync throw error if not found.
      const stat = fs.statSync(filedirAbs);
      if (stat.isDirectory()) {
        if (dirCallback) {
          yield;
          if ('done' === dirCallback(filedir))
            return;
        }
      } else if (stat.isFile()) {
        if (fileCallback) {
          yield;
          if ('done' === fileCallback(filedir))
            return;
        }
      }
    }
  })()) {
    // yield nothing, everything processed by callback.
  } /* for await end */
}

/**
 * Sync seprate the directories and files, the directory or file must be exist.
 * @param {string[]} filesdirs List of directories and files.
 * @param {Function} [fileCallback] Called when occurs file, stop if return "done".
 * @param {Function} [dirCallback] Called when occurs directory, stop if return "done".
 * @param {FSOptions.fs} [options.fs] User provided file system, like the `memfs`, defaults to `fs-extra`.
 * @return {void}
 */
export function separateFilesDirsSync(
  filesdirs: string[],
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = {}
): void {
  const fs = (options && options.fs && isValidFileSystem(options.fs)) ? options.fs : defaultFs;

  for (const filedir of filesdirs) {
    const filedirAbs = path.resolve(filedir);
    // fs.statSync throw error if not found.
    const stat = fs.statSync(filedirAbs);
    if (stat.isDirectory()) {
      if (dirCallback && 'done' === dirCallback(filedir))
        return;
    } else if (stat.isFile()) {
      if (fileCallback && 'done' === fileCallback(filedir))
        return;
    }
  }
}

type PatternFilter = (file: string) => boolean;
const genPatternFilter = (
  pattern: string
): [string, PatternFilter] => {
  // If non glob pattern, pattern filter always return true.
  if (!isGlob(pattern)) {
    return [
      pattern,
      (): boolean => { return true; }
    ];
  }

  return [
    globParent(pattern),
    (path: string): boolean => {
      // Pattern `./test/fixtures/**/*` should match root file index.js, but 
      // minimatch.makeRe failed, using minimatch.match here.
      const matchResults = minimatch.match([path], pattern);
      return matchResults.length !== 0;
    }
  ];
}

const genWalkCallback = (
  callback: FileCallback | DirectoryCallback,
  filter: PatternFilter
): FileCallback | DirectoryCallback => {
  return (pattern: string): string | undefined => {
    pattern = unixlike(pattern);
    const op = (callback !== undefined && filter(pattern)) ? callback(pattern) : undefined;
    if (typeof op === 'string') {
      return op.toLowerCase();
    }
  };
}

enum DirentType {
  DIR = 1,
  FILE,
  SYMBOLIC,
  UNK
}

const getDirentType = function (
  dirent: defaultFs.Dirent | defaultFs.Stats
): DirentType {
  if (dirent.isDirectory()) {
    return DirentType.DIR;
  } else if (dirent.isFile()) {
    return DirentType.FILE;
  } else if (dirent.isSymbolicLink()) {
    return DirentType.SYMBOLIC;
  }
  return DirentType.UNK;
}

/**
 * Async walk through a pattern.  
 * Note: walk is async but the fileCallback and dirCallback should be sync.  
 * If occurs an error, using `Promise.catch` handle it, e.g. `await walk(...).catch(err => { })`.  
 * @param {string} pattern Pattern to search, could be a file, directory or glob pattern.
 * @param {FileCallback} [fileCallback] Called when occurs file, if return "done", stop walking.
 * @param {DirectoryCallback} [dirCallback] Called when occurs directory, if return "done", stop walking; if return "skip", skip this directory.
 * @param {FSOptions.fs} [options.fs] User provided file system, like the `memfs`, defaults to `fs-extra`.
 * @param {FSOptions.useNewAPI} [options.useNewAPI] Whether use new file sytem API `fs.opendir/opendirSync`, it's little slow than `fs.readdir/readdirSync`, defaults to true.
 * @param {FSOptions.bufferSize} [options.bufferSize] `fs.opendir/opendirSync` bufferSize option, defaults to 32.
 * @param {FSOptions.followSymbolic} [options.followSymbolic] Whether follow the symbolic, if false only return symbolic path, defaults to true return the referenced file and directory path. 
 * @return {Promise<void>}
 */
export async function walk(
  pattern: string,
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = {
    fs: defaultFs,
    useNewAPI: true,
    bufferSize: 32,
    followSymbolic: true
  }
): Promise<void> {
  if (typeof pattern !== 'string') {
    throw new Error('Pattern must be a string.');
  }
  if (!isAbsolute(pattern)) {
    pattern = resolvePattern(pattern);
  }

  // Normalize pattern.
  pattern = unixlike(pattern);

  let filter;
  [pattern, filter] = genPatternFilter(pattern);
  fileCallback = genWalkCallback(fileCallback, filter);
  dirCallback = genWalkCallback(dirCallback, filter);

  const fs = (options && options.fs && isValidFileSystem(options.fs)) ? options.fs : defaultFs;
  const useNewAPI = (options && options.useNewAPI === false) ? false : true;
  const bufferSize = (options && typeof options.bufferSize === 'number') ? options.bufferSize : 32;
  const followSymbolic = (options && options.followSymbolic === false) ? false : true;
  const rootPattern = pattern;
  let op: string | void = undefined;

  const walkDirectoryEntry = async function (
    pattern: string,
    {
      type = DirentType.UNK,
      inSymbolic = false,
    }
  ): Promise<void> {
    if (op === 'done') return;

    if (type === DirentType.UNK) {
      type = getDirentType(fs.lstatSync(pattern));
    }

    // Avoid infinite loop.
    if (
      inSymbolic
      && (pattern === rootPattern
        || isSubDirectory(pattern, rootPattern))
    ) {
      return;
    }

    if (type === DirentType.SYMBOLIC && !followSymbolic) {
      type = getDirentType(fs.statSync(pattern));
      if (type === DirentType.DIR) {
        // Not follow this directory symbolic.
        op = dirCallback(pattern);
      } else if (type === DirentType.FILE) {
        op = fileCallback(pattern);
      }
    } else {
      if (type === DirentType.SYMBOLIC) {
        inSymbolic = true;
        type = getDirentType(fs.statSync(pattern));
        pattern = fs.readlinkSync(pattern);
      }

      if (type === DirentType.DIR) {
        op = dirCallback(pattern);
        if (op !== 'done' && op !== 'skip') {
          await walkDirectory(pattern, { inSymbolic: inSymbolic });
        }
      } else if (type === DirentType.FILE) {
        op = fileCallback(pattern);
      }
    }
  }

  const walkDirectory = (typeof fs.opendirSync === 'function' && useNewAPI) ?
    async function (directory: string, { inSymbolic = false }): Promise<void> {
      // ISSUE: On windows `fs.opendir` behave strange for a symbolic/junction 
      // directory, it's should return a `fs.Dirent` of type symbolic, but actually
      // get directory type.
      for await (const dirent of await fs.opendir(directory, { bufferSize: bufferSize })) {
        if (op === 'done') {
          return;
        }
        await walkDirectoryEntry(
          path.join(directory, dirent.name),
          { inSymbolic: inSymbolic }
        );
      }
    } :
    async function (directory: string, { inSymbolic = false }): Promise<void> {
      for (const dirent of await fs.readdir(directory, { withFileTypes: true })) {
        if (op === 'done') {
          return;
        }
        const type = getDirentType(dirent);
        if (type !== DirentType.UNK) {
          await walkDirectoryEntry(
            path.join(directory, dirent.name),
            { type: type, inSymbolic: inSymbolic }
          );
        }
      }
    };

  await walkDirectoryEntry(pattern, { inSymbolic: false });
}

/**
 * Sync walk through a pattern.  
 * @param {string} pattern Pattern to search, could be a file, directory or glob pattern.
 * @param {FileCallback} [fileCallback] Called when occurs file, if return "done", stop walking.
 * @param {DirectoryCallback} [dirCallback] Called when occurs directory, if return "done", stop walking; if return "skip", skip this directory.
 * @param {FSOptions.fs} [options.fs] User provided file system, like the `memfs`, defaults to `fs-extra`.
 * @param {FSOptions.useNewAPI} [options.useNewAPI] Whether use new file sytem API `fs.opendir/opendirSync`, it's little slow than `fs.readdir/readdirSync`, defaults to true.
 * @param {FSOptions.bufferSize} [options.bufferSize] `fs.opendir/opendirSync` bufferSize option, defaults to 32.
 * @param {FSOptions.followSymbolic} [options.followSymbolic] Whether follow the symbolic, if false only return symbolic path, defaults to true return the referenced file and directory path. 
 * @return {Promise<void>}
 */
export function walkSync(
  pattern: string,
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = {
    fs: defaultFs,
    useNewAPI: true,
    bufferSize: 32,
    followSymbolic: true
  }
): void {
  if (typeof pattern !== 'string') {
    throw new Error('Pattern must be a string.');
  }
  if (!isAbsolute(pattern)) {
    pattern = resolvePattern(pattern);
  }

  // Normalize pattern.
  pattern = unixlike(pattern);

  let filter;
  [pattern, filter] = genPatternFilter(pattern);
  fileCallback = genWalkCallback(fileCallback, filter);
  dirCallback = genWalkCallback(dirCallback, filter);

  const fs = (options && options.fs && isValidFileSystem(options.fs)) ? options.fs : defaultFs;
  const useNewAPI = (options && options.useNewAPI === false) ? false : true;
  const bufferSize = (options && typeof options.bufferSize === 'number') ? options.bufferSize : 32;
  const followSymbolic = (options && options.followSymbolic === false) ? false : true;
  const rootPattern = pattern;
  let op: string | void = undefined;

  const walkDirectoryEntry = function (
    pattern: string,
    {
      type = DirentType.UNK,
      inSymbolic = false,
    }
  ): void {
    if (op === 'done') return;

    if (type === DirentType.UNK) {
      type = getDirentType(fs.lstatSync(pattern));
    }

    // Avoid infinite loop.
    if (
      inSymbolic
      && (pattern === rootPattern
        || isSubDirectory(pattern, rootPattern))
    ) {
      return;
    }

    if (type === DirentType.SYMBOLIC && !followSymbolic) {
      type = getDirentType(fs.statSync(pattern));
      if (type === DirentType.DIR) {
        // Not follow this directory symbolic.
        op = dirCallback(pattern);
      } else if (type === DirentType.FILE) {
        op = fileCallback(pattern);
      }
    } else {
      if (type === DirentType.SYMBOLIC) {
        inSymbolic = true;
        type = getDirentType(fs.statSync(pattern));
        pattern = fs.readlinkSync(pattern);
      }

      if (type === DirentType.DIR) {
        op = dirCallback(pattern);
        if (op !== 'done' && op !== 'skip') {
          walkDirectory(pattern, { inSymbolic: inSymbolic });
        }
      } else if (type === DirentType.FILE) {
        op = fileCallback(pattern);
      }
    }
  }

  const walkDirectory = (typeof fs.opendirSync === 'function' && useNewAPI) ?
    function (directory: string, { inSymbolic = false }): void {
      const opendir = fs.opendirSync(directory, { bufferSize: bufferSize });
      let dirent;
      while ((dirent = opendir.readSync())) {
        if (op === 'done') {
          break;
        }
        walkDirectoryEntry(
          path.join(directory, dirent.name),
          { inSymbolic: inSymbolic }
        );
      }
      opendir.closeSync();
    } :
    function (directory: string, { inSymbolic = false }): void {
      for (const dirent of fs.readdirSync(directory, { withFileTypes: true })) {
        if (op === 'done') {
          break;
        }
        walkDirectoryEntry(
          path.join(directory, dirent.name),
          { inSymbolic: inSymbolic }
        );
      }
    };

  walkDirectoryEntry(pattern, { inSymbolic: false });
}
