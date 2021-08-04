import * as _fs from 'fs-extra';
import * as path from 'path';

export type FileCallback = (file: string) => string | void;
export type DirectoryCallback = (dir: string) => string | void;

export interface FSFileSystem {
  opendir: typeof _fs.opendir;
  opendirSync: typeof _fs.opendirSync;
  readdir: typeof _fs.readdir;
  readdirSync: typeof _fs.readdirSync;
  statSync: typeof _fs.statSync;
  lstatSync: typeof _fs.lstatSync;
  readlinkSync: typeof _fs.readlinkSync;
}

export interface FSOptions {
  /** User provided file system, like the memfs, defaults to fs-extra. */
  fs?: FSFileSystem;
  /** Whether use new filesytem API fs.opendir/opendirSync, it's little slow 
   * than fs.readdir/readdirSync, defaults to true. */
  useNewAPI?: boolean;
  /** fs.opendir/opendirSync bufferSize option, defaults to 32. */
  bufferSize?: number;
}

/**
 * Async walk throurgh a directory.  
 * Note: walk is async but the fileCallback and dirCallback are sync.  
 * If occurs an error, using `Promise.catch` handle it, e.g. `await walk(...).catch(err => { })`.  
 * @param {string} dir Directory to search.
 * @param {FileCallback} [fileCallback] Called when occurs file, if return "done", stop walking.
 * @param {DirectoryCallback} [dirCallback] Called when occurs directory, if return "done", stop walking; if return "skip", skip current directory.
 * @param {FSOptions} [options]
 * @return {Promise<void>}
 */
export async function walk(
  dir: string,
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = { useNewAPI: true }
): Promise<void> {
  const fs = (options && options.fs) ? options.fs : _fs;
  const useNewAPI = (options && options.useNewAPI === false) ? false : true;
  const buffersize = (options && options.bufferSize) ? options.bufferSize : 32;
  dir = path.resolve(dir);

  const innerWalk = (typeof fs.opendir === 'function' && useNewAPI) ?
    async function* (subdir: string): AsyncGenerator<void, void, void> {
      for await (const dirent of await fs.opendir(subdir, { bufferSize: buffersize })) {
        let direntPath = path.join(subdir, dirent.name);
        if (dirent.isDirectory()) {
          const lstat = fs.lstatSync(direntPath);
          // If a directory symbolic link, read the target.
          if (lstat.isSymbolicLink()) {
            direntPath = fs.readlinkSync(direntPath);
            // If the target is a sub directory, this cause infinite loop, ignore it.
            if (isSubDirectory(direntPath, dir))
              continue;
          }
          let op;
          if (dirCallback) {
            yield;
            op = dirCallback(direntPath);
          }
          if ('done' === op)
            return;
          if ('skip' !== op)
            yield* innerWalk(direntPath);
        } else if (dirent.isFile()) {
          if (fileCallback) {
            yield;
            if ('done' === fileCallback(direntPath))
              return;
          }
        } else if (dirent.isSymbolicLink()) {
          const stat = fs.statSync(direntPath);
          // If a file symbolic link, return link.
          if (stat.isFile()) {
            if (fileCallback) {
              yield;
              if ('done' === fileCallback(direntPath))
                return;
            }
          }
        }
      }
    } :
    async function* (subdir: string): AsyncGenerator<void, void, void> {
      for await (const dirent of await fs.readdir(subdir, { withFileTypes: true })) {
        const direntPath = path.join(subdir, dirent.name);
        if (dirent.isDirectory()) {
          let op;
          if (dirCallback) {
            yield;
            op = dirCallback(direntPath);
          }
          if ('done' === op)
            return;
          if ('skip' !== op)
            yield* innerWalk(direntPath);
        } else if (dirent.isFile()) {
          if (fileCallback) {
            yield;
            if ('done' === fileCallback(direntPath))
              return;
          }
        } else if (dirent.isSymbolicLink()) {
          const stat = fs.statSync(direntPath);
          if (stat.isDirectory()) {
            const target = fs.readlinkSync(direntPath);
            // If the target is a sub directory, this cause infinite loop, ignore it.
            if (!isSubDirectory(target, dir)) {
              let op;
              if (dirCallback) {
                yield;
                op = dirCallback(direntPath);
              }
              if ('done' === op)
                return;
              if ('skip' !== op)
                yield* innerWalk(direntPath);
            }
          } else if (stat.isFile()) {
            // If a file symbolic link, return link.
            if (fileCallback) {
              yield;
              if ('done' === fileCallback(direntPath))
                return;
            }
          }
        }
      }
    };

  // Async iterators, see https://qwtel.com/posts/software/async-generators-in-the-wild/#what-are-async-iterators
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const p of innerWalk(dir)) {
    // yield nothing, everything processed by callback.
  }
}

/**
 * Sync walk throurgh a directory.
 * @param {string} dir Directory to search.
 * @param {FileCallback} [fileCallback] Called when occurs file, if return "done", stop walking.
 * @param {DirectoryCallback} [dirCallback] Called when occurs directory, if return "done", stop walking; if return "skip", skip current directory.
 * @param {FSOptions} [options]
 * @return {void}
 */
export function walkSync(
  dir: string,
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = { useNewAPI: true }
): void {
  const fs = (options && options.fs) ? options.fs : _fs;
  const useNewAPI = (options && options.useNewAPI === false) ? false : true;
  const buffersize = (options && options.bufferSize) ? options.bufferSize : 32;
  dir = path.resolve(dir);

  const innerWalk = (typeof fs.opendirSync === 'function' && useNewAPI) ?
    (subdir: string): void => {
      const opendir = fs.opendirSync(subdir, { bufferSize: buffersize });
      let dirent;
      while ((dirent = opendir.readSync())) {
        let direntPath = path.join(opendir.path, dirent.name);
        if (dirent.isDirectory()) {
          const lstat = fs.lstatSync(direntPath);
          // If a directory symbolic link, read the target.
          if (lstat.isSymbolicLink()) {
            direntPath = fs.readlinkSync(direntPath);
            // If the target is a sub directory, this cause infinite loop, ignore it.
            if (isSubDirectory(direntPath, dir))
              continue;
          }
          const op = dirCallback && dirCallback(direntPath);
          if ('done' === op)
            return;
          if ('skip' !== op)
            innerWalk(direntPath);
        } else if (dirent.isFile()) {
          if (fileCallback && 'done' === fileCallback(direntPath))
            return;
        } else if (dirent.isSymbolicLink()) {
          const stat = fs.statSync(direntPath);
          // If a file symbolic link, return link.
          if (stat.isFile() && fileCallback && 'done' === fileCallback(direntPath))
            return;
        }
      }
      opendir.closeSync();
    } :
    (subdir: string): void => {
      for (const dirent of fs.readdirSync(subdir, { withFileTypes: true })) {
        const direntPath = path.join(subdir, dirent.name);
        if (dirent.isDirectory()) {
          const op = dirCallback && dirCallback(direntPath);
          if ('done' === op)
            return;
          if ('skip' !== op)
            innerWalk(direntPath);
        } else if (dirent.isFile()) {
          if (fileCallback && 'done' === fileCallback(direntPath))
            return;
        } else if (dirent.isSymbolicLink()) {
          const stat = fs.statSync(direntPath);
          if (stat.isDirectory()) {
            const target = fs.readlinkSync(direntPath);
            // If the target is a sub directory, this cause infinite loop, ignore it.
            if (!isSubDirectory(target, dir)) {
              const op = dirCallback && dirCallback(direntPath);
              if ('done' === op)
                return;
              if ('skip' !== op)
                innerWalk(direntPath);
            }
          } else if (stat.isFile()) {
            // If a file symbolic link, return link.
            if (fileCallback && 'done' === fileCallback(direntPath))
              return;
          }
        }
      }
    };

  innerWalk(dir);
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

/**
 * Async seprate the directories and files, the directory or file must be exist.
 * Note: separateFilesDirs is async but the fileCallback and dirCallback are sync.  
 * If occurs an error, using `Promise.catch` handle it, e.g. `await separateFilesDirs(...).catch(err => { })`.  
 * @param {string[]} filesdirs List of directories and files.
 * @param {Function} [fileCallback] Called when occurs file, stop if return "done".
 * @param {Function} [dirCallback] Called when occurs directory, stop if return "done".
 * @param {FSOptions} options
 * @return {void}
 */
export async function separateFilesDirs(
  filesdirs: string[],
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = {}
): Promise<void> {
  const fs = (options && options.fs) ? options.fs : _fs;

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
 * @param {FSOptions} options
 * @return {void}
 */
export function separateFilesDirsSync(
  filesdirs: string[],
  fileCallback: FileCallback = (): void => { return; },
  dirCallback: DirectoryCallback = (): void => { return; },
  options: FSOptions = {}
): void {
  const fs = (options && options.fs) ? options.fs : _fs;

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
