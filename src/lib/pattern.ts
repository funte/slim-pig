import * as os from 'os';
const isWin32 = os.platform() === 'win32';
import * as path from 'path';

const NEGATION = '!';
const DOT = '.';
const COLON = ':';
const SLASH = '/';
const BACKSLASH = '\\';

function isWindowsDeviceRoot(char: string): boolean {
  return (char >= 'A' && char <= 'Z') ||
    (char >= 'a' && char <= 'z');
}

function isPathSeparator(char: string): boolean {
  return char === SLASH || char === BACKSLASH;
}

/**
 * Extract directory part from the pattern.  
 * The returned directory has no trailing path separator and the first negative symbol "!" will be ignored.  
 * !! If returned directory is a lonly windows device root, keep the trailing path separator.  
 */
export function globParent(
  pattern: string
): string {
  if (typeof pattern !== 'string') {
    throw new TypeError('Pattern must be a string.');
  }

  // Remove negation.
  if (pattern[0] === '!') {
    pattern = pattern.slice(1);
  }
  // Transform empty to CWD.
  if (pattern === '') {
    return DOT;
  }

  // Normalize and convert to POSIX path separator..
  // !!Must be unconditional.
  pattern = unixlike(pattern);

  // Extract directory.
  if (isGlob(pattern)) {
    const dirname = isWin32Pattern(pattern) ? path.win32.dirname : path.posix.dirname;
    do {
      pattern = dirname(pattern);
    } while (isGlob(pattern));
  }

  // Remove the trailing path separator.
  if (pattern.length > 1 && isPathSeparator(pattern[pattern.length - 1])) {
    pattern = pattern.slice(0, pattern.length - 1);
  }

  // Add trailing slash for lonly windows device root.
  if (
    pattern.length === 2
    && isWindowsDeviceRoot(pattern[0])
    && pattern[1] === COLON
  ) {
    pattern += SLASH;
  }

  // Convert to win32 path separator if need.
  if (isWin32) {
    pattern = pattern.split(SLASH).join(BACKSLASH);
  }

  return pattern;
}

/**
 * Extract glob part from the glob pattern.  
 * The returned glob has no leading, trailing path separator and the first 
 * negative symbol "!"" will be ignored.  
 */
export function globPart(
  pattern: string
): string {
  if (typeof pattern !== 'string') {
    throw new TypeError('Pattern must be a string.');
  }

  // Remove negation.
  if (pattern[0] === '!') {
    pattern = pattern.slice(1);
  }
  // Empty and CWD and non glob return empty.
  if (pattern === '' || pattern === '.' || !isGlob(pattern)) {
    return '';
  }

  // Normalize and convert to POSIX path separator, for aligning directory and pattern.
  // !!Must be unconditional.
  pattern = unixlike(pattern);

  // Extract the directory part, without the trailing path separator.
  let directory = globParent(pattern);
  // If directory part is `.`, the pattern implict the CWD or a pure glob, 
  // set empty.
  if (directory === DOT && pattern[0] !== DOT) {
    directory = '';
  }

  // Extract the glob part.
  let glob = pattern.slice(directory.length);
  if (glob !== '') {
    // Remove the leading slash.
    if (glob[0] === SLASH) {
      glob = glob.slice(1);
    }
    // Remove the trailing slash.
    if (glob.length > 1 && isPathSeparator(glob[glob.length - 1])) {
      glob = glob.slice(0, glob.length - 1);
    }
  }

  // Convert to win32 path separator if need.
  if (isWin32) {
    glob = glob.split(SLASH).join(BACKSLASH);
  }

  return glob;
}

/**
 * Whether an absolute pattern.  
 * If start with windows device root, its absolute.  
 * If start with slash, only absolute on linux, else platform and unknow pattern 
 * are not absolute.  
 */
export function isAbsolute(pattern: string): boolean {
  // Remove leading negation.
  if (pattern[0] === NEGATION) {
    pattern = pattern.slice(1);
  }

  // If an obvious windows pattern, return true.
  if (
    pattern.length > 2
    && isWindowsDeviceRoot(pattern[0])
    && pattern[1] === COLON
    && isPathSeparator(pattern[2])
  ) {
    return true;
  }

  // If start with slash, only absolute on linux, else platform and unknow 
  // pattern are not absolute.
  if (pattern[0] === SLASH && !isWin32) {
    return true;
  } else {
    return false;
  }
}

const COMMON_GLOB_SYMBOLS_RE = /[*]|^!/;
const REGEX_CHARACTER_CLASS_SYMBOLS_RE = /\[.*]/;
const REGEX_GROUP_SYMBOLS_RE = /(?:^|[^!*+?@])\(.*\|.*\)/;
const GLOB_EXTENSION_SYMBOLS_RE = /[!*+?@]\(.*\)/;
const BRACE_EXPANSIONS_SYMBOLS_RE = /{.*(?:,|\.\.).*}/;

/**
 * Is a glob pattern.  
 * All matching features, see: https://github.com/isaacs/minimatch#features.  
 */
export function isGlob(pattern: string): boolean {
  if (typeof pattern !== 'string') {
    throw new TypeError('Pattern must be a string.');
  }
  if (pattern === '') return false;

  if (
    COMMON_GLOB_SYMBOLS_RE.test(pattern)
    || REGEX_CHARACTER_CLASS_SYMBOLS_RE.test(pattern)
    || REGEX_GROUP_SYMBOLS_RE.test(pattern)
    || GLOB_EXTENSION_SYMBOLS_RE.test(pattern)
    || BRACE_EXPANSIONS_SYMBOLS_RE.test(pattern)
  ) {
    return true;
  }

  return false;
}

/**
 * Whether a windows pattern.  
 * If start with windows device root, return true, else rely on the platform.  
 */
export function isWin32Pattern(pattern: string): boolean {
  // Remove leading negation.
  if (pattern[0] === NEGATION) {
    pattern = pattern.slice(1);
  }

  // If an obvious windows pattern, return true.
  // If start with path separator, treat as unknow.
  if (
    pattern.length > 2
    && isWindowsDeviceRoot(pattern[0])
    && pattern[1] === COLON
    && isPathSeparator(pattern[2])
  ) {
    return true;
  }

  // Unknow pattern rely on platform, return true if on windows.
  if (isWin32) {
    return true;
  } else {
    return false;
  }
}

/** Remove leading dot from pattern. */
export function removeLeadingDot(pattern: string): string {
  if (typeof pattern !== 'string') {
    throw new TypeError('Pattern must be a non-empty string.');
  }

  if (pattern.charAt(0) === '.') {
    const secondCharactery = pattern.charAt(1);

    if (secondCharactery === SLASH || secondCharactery === BACKSLASH)
      return pattern.slice(2);
  }

  return pattern;
}

/**
 * Resolve the pattern to absolute.
 * @param context - An absolute directory used to resolve the relative 
 * `pattern` to absolute, defaults to `process.cwd()`.  
 * If the `pattern` is absolute, ignore this parameter.  
 */
export function resolvePattern(
  pattern: string,
  context: string | void = undefined
): string {
  const validateAndNormalizeContext = function () {
    if (typeof context !== 'string') {
      context = process.cwd();
    }

    context = path.normalize(context);

    if (isGlob(context)) {
      throw new TypeError('Context must be non glob.');
    }

    if (!isAbsolute(context)) {
      throw new TypeError('Context must be an absolute directory.');
    }
  } /* validateAndNormalizeContext */

  if (typeof pattern !== 'string') {
    throw new TypeError('Pattern must be a string.');
  }

  // Record negation.
  let negative = false;
  if (pattern[0] === '!') {
    negative = true;
    pattern = pattern.slice(1);
  }

  pattern = path.normalize(pattern);

  let glob = '';
  if (isGlob(pattern)) {
    // Extract the directory part, without the trailing path separator.
    let directory = globParent(pattern);
    // If directory part is `.`, the pattern is a pure glob or implict the CWD, 
    // empty it.
    if (directory === DOT && pattern[0] !== DOT) {
      directory = '';
    }

    // Extract the glob part.
    glob = pattern.slice(directory.length);
    if (glob !== '' && glob.length > 0) {
      // Remove the leading slash.
      if (isPathSeparator(glob[0])) {
        glob = glob.slice(1);
      }
      // Remove the trailing slash.
      if (glob.length > 1 && isPathSeparator(glob[glob.length - 1])) {
        glob = glob.slice(0, glob.length - 1);
      }
    }

    pattern = directory;
  }

  if (!isAbsolute(pattern)) {
    validateAndNormalizeContext();
    pattern = context + path.sep + pattern;
  }
  // Join glob.
  if (glob !== '') {
    // pattern = pattern + SLASH + glob;
    pattern = pattern + path.sep + glob;
  }
  pattern = path.normalize(pattern);

  // Add trailing slash for lonly windows device root.
  if (
    pattern.length === 2
    && isWindowsDeviceRoot(pattern[0])
    && pattern[1] === COLON
  ) {
    pattern += path.sep;
  }

  // Add negation.
  if (negative) {
    pattern = '!' + pattern;
  }

  return pattern;
}

/** Normalize and convert to POSIX path separator. */
export function unixlike(pattern: string): string {
  if (typeof pattern !== 'string') {
    throw new TypeError('Pattern must be a string.');
  }

  // Record negation.
  let negative = false;
  if (pattern[0] === '!') {
    negative = true;
    pattern = pattern.slice(1);
  }

  pattern = path.posix.normalize(pattern.split(BACKSLASH).join(SLASH));

  // Add negation.
  if (negative) {
    pattern = '!' + pattern;
  }

  return pattern;
}
