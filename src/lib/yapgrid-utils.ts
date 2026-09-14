export /**
 * Membersihkan URL YapGrid mentah dari parameter yang tidak diperlukan (seperti 'spm', 'utm_source')
 * dan hanya mempertahankan parameter yang valid seperti 'sub_url'.
 * 
 * @param rawUrl URL mentah dari YapGrid (misal: https://yapgrid.com/embed/movie/123?spm=xxx&sub_url=)
 * @returns URL bersih atau null jika URL tidak valid
 */
export function cleanYapGridUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    
    // Pastikan domainnya benar
    if (!url.hostname.includes('yapgrid.com')) {
      return null;
    }

    // Ambil path (contoh: /embed/movie/1058424)
    const pathname = url.pathname;
    
    // Validasi basic path
    if (!pathname.startsWith('/embed/')) {
      return null;
    }

    let cleanUrl = `https://yapgrid.com${pathname}`;

    // Ambil sub_url jika ada dan tidak kosong
    const subUrl = url.searchParams.get('sub_url');
    if (subUrl && subUrl.trim() !== '') {
      cleanUrl += `?sub_url=${encodeURIComponent(subUrl.trim())}`;
    }

    return cleanUrl;
  } catch (error) {
    console.error('Gagal membersihkan URL YapGrid:', error);
    return null;
  }
}
