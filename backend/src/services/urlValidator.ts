const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const ALLOWED_EXTENSIONS = ['.m3u8', '.mp4', '.webm'];

export function isValidStreamUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return false;
    }

    const pathname = parsed.pathname.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
      pathname.endsWith(ext)
    );
    const isHlsManifest =
      pathname.endsWith('.m3u8') || url.toLowerCase().includes('.m3u8');

    return hasAllowedExtension || isHlsManifest;
  } catch {
    return false;
  }
}

export function sanitizeString(input: string, maxLength = 256): string {
  return input.trim().slice(0, maxLength);
}
