/**
 * Utility functions to format media runtime and certification badges cleanly.
 */

export function formatMediaRuntime(
  runtime?: string,
  type?: 'movie' | 'tv',
  seasonsCount?: number
): string {
  if (!runtime && type === 'tv') {
    const s = seasonsCount || 1;
    return `Season ${s}`;
  }
  if (!runtime) return '2h';

  const trimmed = runtime.trim();

  // If already like "Season 1", "Season 2"
  if (/^Season\s+\d+$/i.test(trimmed)) {
    return trimmed;
  }

  // Handle "1 Season", "2 Seasons", "1 Seasons", "Seasons 1" -> "Season X"
  const match1 = trimmed.match(/^(\d+)\s*seasons?$/i);
  if (match1) {
    return `Season ${match1[1]}`;
  }

  const match2 = trimmed.match(/^seasons?\s*(\d+)$/i);
  if (match2) {
    return `Season ${match2[1]}`;
  }

  if (type === 'tv' && seasonsCount) {
    return `Season ${seasonsCount}`;
  }

  return trimmed;
}

export function formatCertification(cert?: string, type?: 'movie' | 'tv'): string {
  if (!cert || cert.trim() === '') {
    return type === 'tv' ? 'TV-14' : 'PG-13';
  }

  let clean = cert.trim();
  // Remove awkward spacing around hyphens: e.g. "TV - 14" -> "TV-14", "PG - 13" -> "PG-13"
  clean = clean.replace(/\s*-\s*/g, '-');

  // Handle various formats
  if (/^TV\s*14$/i.test(clean)) return 'TV-14';
  if (/^TV\s*MA$/i.test(clean)) return 'TV-MA';
  if (/^TV\s*PG$/i.test(clean)) return 'TV-PG';
  if (/^TV\s*G$/i.test(clean)) return 'TV-G';
  if (/^TV\s*Y7$/i.test(clean)) return 'TV-Y7';
  if (/^PG\s*13$/i.test(clean)) return 'PG-13';
  if (/^NC\s*17$/i.test(clean)) return 'NC-17';

  return clean.toUpperCase();
}
