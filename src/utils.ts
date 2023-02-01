export function isHex(str: string): boolean {
  const regexp = /^0x[0-9A-F]+$/i
  return regexp.test(str)
}
