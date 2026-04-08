import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns/promises';

function isPrivateIp(ip: string): boolean {
  // IPv6 loopback / link-local / ULA
  if (ip === '::1' || ip === '::') return true;
  if (/^fe80:/i.test(ip)) return true;
  if (/^f[cd]/i.test(ip)) return true;

  // IPv4 private / reserved ranges
  const privateRanges = [
    /^127\./,                                      // loopback
    /^10\./,                                       // RFC 1918 class A
    /^172\.(1[6-9]|2\d|3[01])\./,                 // RFC 1918 class B
    /^192\.168\./,                                 // RFC 1918 class C
    /^169\.254\./,                                 // link-local
    /^0\./,                                        // this-network
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // shared address (RFC 6598)
    /^192\.0\.2\./,                                // TEST-NET-1
    /^198\.51\.100\./,                             // TEST-NET-2
    /^203\.0\.113\./,                              // TEST-NET-3
    /^24[0-9]\./,                                  // reserved / future use
    /^255\.255\.255\.255$/,                        // broadcast
  ];
  return privateRanges.some((re) => re.test(ip));
}

/**
 * Validates a user-supplied URL to prevent SSRF attacks.
 * - Enforces HTTPS scheme.
 * - Resolves the hostname and blocks private/loopback/link-local IP ranges.
 */
export async function validateHttpsUrl(urlString: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new BadRequestException('Invalid URL: must be a valid URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new BadRequestException('Invalid URL: only HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname;
  let address: string;
  try {
    const result = await lookup(hostname);
    address = result.address;
  } catch {
    throw new BadRequestException(`Invalid URL: unable to resolve hostname "${hostname}"`);
  }

  if (isPrivateIp(address)) {
    throw new BadRequestException('Invalid URL: resolved to a private or reserved IP address');
  }
}
