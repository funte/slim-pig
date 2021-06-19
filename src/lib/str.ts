/**
 * Convert windows path separator "\\" to "/".
 * @param {stirng} str file or directory path.
 * @return {string}
 */
export function unixlike(str: string): string {
  return str.split('\\').join('/');
}
