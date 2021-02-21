/**
 * 将路径字符串中的 '\' 转换为 '/'.
 */
export function unixlike(str: string): string {
  return str.split('\\').join('/');
}
