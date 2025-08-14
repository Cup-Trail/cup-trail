import { supabase } from '@cuptrail/data';
import { decode } from 'base64-arraybuffer';
import type * as ExpoFileSystem from 'expo-file-system';

let FileSystem: typeof ExpoFileSystem | null = null;
try {
  FileSystem = require('expo-file-system');
} catch {
  FileSystem = null;
}

const MEDIA_BUCKET = 'review-photos' as const;

export type UploadableMedia = {
  uri: string;
  /** Can be 'image' | 'video' or a full mime type like 'image/jpeg' */
  type?: string;
  /** Optional original filename to preserve */
  fileName?: string;
  /** Explicit mime type if available */
  mimeType?: string;
};

function inferMimeAndExtension(m: UploadableMedia): {
  mime: string;
  ext: string;
  kind: 'image' | 'video';
} {
  const t = (m.mimeType || m.type || '').toLowerCase();

  // Videos first
  if (t.includes('video')) {
    if (t.includes('quicktime') || t.includes('mov')) {
      return { mime: 'video/quicktime', ext: 'mov', kind: 'video' };
    }
    return { mime: 'video/mp4', ext: 'mp4', kind: 'video' };
  }

  // Images by declared type
  if (t.includes('heic') || t.includes('heif'))
    return { mime: 'image/heic', ext: 'heic', kind: 'image' };
  if (t.includes('png'))
    return { mime: 'image/png', ext: 'png', kind: 'image' };
  if (t.includes('webp'))
    return { mime: 'image/webp', ext: 'webp', kind: 'image' };
  if (t.includes('jpeg') || t.includes('jpg'))
    return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' };

  // Fallback to uri extension heuristics
  const lower = m.uri.toLowerCase();
  if (lower.endsWith('.png'))
    return { mime: 'image/png', ext: 'png', kind: 'image' };
  if (lower.endsWith('.webp'))
    return { mime: 'image/webp', ext: 'webp', kind: 'image' };
  if (lower.endsWith('.heic') || lower.endsWith('.heif'))
    return { mime: 'image/heic', ext: 'heic', kind: 'image' };
  if (lower.endsWith('.mov'))
    return { mime: 'video/quicktime', ext: 'mov', kind: 'video' };
  if (lower.endsWith('.mp4'))
    return { mime: 'video/mp4', ext: 'mp4', kind: 'video' };

  // Final default
  return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' };
}

const sanitizePathSegment = (s: string) =>
  s.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '');

export type UploadMediaResult =
  | { success: true; url: string; path: string }
  | {
      success: false;
      message: string;
      source?: 'supabase' | 'expo' | 'unknown';
      error?: unknown;
    };

export async function uploadMedia(
  media: UploadableMedia,
  opts?: { folder?: string; upsert?: boolean; cacheSeconds?: number }
): Promise<UploadMediaResult> {
  if (!FileSystem) {
    throw new Error(
      'expo-file-system is required but not available. Make sure you are running in an Expo environment or have expo-file-system installed as a peer dependency.'
    );
  }

  try {
    const info = await FileSystem.getInfoAsync(media.uri);
    if (!info.exists) {
      return {
        success: false,
        message: 'File does not exist at URI',
        source: 'expo',
      };
    }

    // Read the file as base64 and convert to ArrayBuffer (supported by supabase-js on native)
    const base64 = await FileSystem.readAsStringAsync(media.uri, {
      encoding: 'base64',
    });
    const arrayBuffer = decode(base64);

    const { mime, ext } = inferMimeAndExtension(media);

    const baseName = (media.fileName || `media.${ext}`).replace(/\s+/g, '_');
    const unique = Math.random().toString(36).slice(2, 8);
    const sanitizedName = baseName.includes('.')
      ? baseName.replace(/\.(\w+)$/, `_${unique}.$1`)
      : `${baseName}_${unique}.${ext}`;

    const filePath = opts?.folder
      ? `${sanitizePathSegment(opts.folder)}/${sanitizedName}`
      : sanitizedName;

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: mime,
        cacheControl: String(opts?.cacheSeconds ?? 3600),
        upsert: opts?.upsert ?? false,
      });

    if (uploadError) {
      return {
        success: false,
        source: 'supabase',
        message: `uploadMedia: ${uploadError.message}`,
      };
    }

    const { data: urlData } = await supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl, path: filePath };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message ?? 'Unknown error',
      source: 'unknown',
      error: err,
    };
  }
}
