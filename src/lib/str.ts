import * as path from 'path';

/**
 * Convert windows path separator "\\" to "/".
 * @param {stirng} str file or directory path.
 * @return {string}
 */
export function unixlike(str: string): string {
  return path.normalize(str).split(path.sep).join(path.posix.sep);
}

/**
 * A simple string formatter that using tagged template.
 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates. 
 */
export class StringFormatter {
  strings: TemplateStringsArray | undefined;
  placeholders: (string | number)[] | undefined;

  setTemplate(strings: TemplateStringsArray, ...placeholders: (string | number)[]): StringFormatter {
    this.strings = strings;
    this.placeholders = placeholders;

    return this;
  }

  format(...values: any[]): string {
    if (this.strings === undefined || this.placeholders === undefined)
      return '';

    const dict = values[values.length - 1] || {};
    const result = [this.strings[0]];

    for (const [i, key] of this.placeholders.entries()) {
      const value = Number.isInteger(key) ? values[key as number] : dict[key];
      result.push(value, this.strings[i + 1]);
    }
    return result.join('');
  }
}
