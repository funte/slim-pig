/**
 * Convert windows path separator "\\" to "/".
 * @param {stirng} str file or directory path.
 * @return {string}
 */
export function unixlike(str: string): string {
  return str.split('\\').join('/');
}

/**
 * A simple string formatter.
 * See https://stackoverflow.com/a/4673436/5906199. 
 */
export class StringFormatter {
  form: string;

  /**
   * @param {string} form Form string with placeholers {0}, {1} ....
   */
  constructor(form: string) {
    if (typeof form === 'string') {
      this.form = form;
    } else {
      console.log('hit');
      this.form = '';
    }
  }

  /**
   * Replace the placeholders {0}, {1} ... with provided args.
   * @param {string[]} args
   */
  format(args: string[]): string {
    return StringFormatter.format(this.form, args);
  }

  /**
   * @param {string} form Form string with placeholers {0}, {1} ....
   * @param {string[]} args
   */
  static format(form: string, args: string[]): string {
    return form.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match;
    });
  }
}
