/** Nomi fayl az API (Spec 12 §1) → URL tavassuti BFF */
export function mediaUrl(fileName: string | null | undefined): string | null {
  return fileName ? `/api/images/${encodeURIComponent(fileName)}` : null;
}

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
export const isVideoFile = (fileName: string) => VIDEO_EXT.test(fileName);
