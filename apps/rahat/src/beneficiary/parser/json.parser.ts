export function JsonParser(buffer: Buffer) {
  return JSON.parse(buffer.toString('utf8'));
}
