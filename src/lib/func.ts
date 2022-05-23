/**
 * Is async function.
 * See https://stackoverflow.com/a/40539727/5906199.
 * @param func - Function to test.
 */
export function isAsyncFunction(func: any): boolean {
  const str = func.toString().trim();
  return /async/i.test(str) || /await/i.test(str);
}

/**
 * Run function and get cost time.
 * @param func - Function to run.
 * @param args - Function arguments.
 */
export async function runcost(func: any, ...args: any[]): Promise<number> {
  let start;
  if (isAsyncFunction(func)) {
    start = Date.now();
    await func(...args);
  } else {
    start = Date.now();
    func(...args);
  }

  return Date.now() - start;
}

