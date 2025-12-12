import { supabase } from '@cuptrail/utils';

const sanitizePathSegment = (s: string) =>
  s
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, ''); // prevent hidden/unexpected filenames

export type SharedUploadParams = {
  content: ArrayBuffer | File;
  bucket: string;
  filePath: string;
  mimeType: string;
};

export type SharedUploadResult =
  | { success: true; url: string; path: string }
  | { success: false; message: string; error?: unknown };

export async function uploadToSupabase(
  params: SharedUploadParams,
  opts?: { upsert?: boolean; cacheSeconds?: number }
): Promise<SharedUploadResult> {
  const { bucket, content, filePath, mimeType } = params;

  if (!bucket || !filePath || !mimeType) {
    return {
      success: false,
      message: 'uploadToSupabase: missing required params',
    };
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, content, {
      contentType: mimeType,
      cacheControl: String(opts?.cacheSeconds ?? 3600),
      upsert: opts?.upsert ?? false,
    });

  if (error) {
    return {
      success: false,
      message: `uploadToSupabase: ${error.message}`,
      error,
    };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    return {
      success: false,
      message: 'uploadToSupabase: No public URL available',
    };
  }

  return { success: true, url: data.publicUrl, path: filePath };
}

type MediaInput = {
  content: ArrayBuffer | File;
  mime: string;
  ext: string;
  fileName?: string;
};

const generateUniqueName = (base: string, ext: string) =>
  `${base.replace(/\.[^.]+$/, '')}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

const normalizeBaseName = (name: string | undefined, ext: string) =>
  (name || `media.${ext}`).replace(/\s+/g, '_');

export async function uploadReviewMedia(reviewId: string, media: MediaInput) {
  const base = normalizeBaseName(media.fileName, media.ext);
  const fileName = generateUniqueName(base, media.ext);
  const filePath = `reviews/${sanitizePathSegment(reviewId.toLowerCase())}/${fileName}`;

  return uploadToSupabase({
    bucket: 'media',
    content: media.content,
    filePath,
    mimeType: media.mime,
  });
}

export async function uploadShopMedia(shopId: string, media: MediaInput) {
  const base = normalizeBaseName(media.fileName, media.ext);
  const fileName = generateUniqueName(base, media.ext);
  const filePath = `shops/${sanitizePathSegment(shopId.toLowerCase())}/${fileName}`;

  return uploadToSupabase({
    bucket: 'shops',
    content: media.content,
    filePath,
    mimeType: media.mime,
  });
}

export async function uploadProfilePhoto(userId: string, media: MediaInput) {
  const ext = media.ext || 'jpg';
  const filePath = `profiles/${sanitizePathSegment(userId.toLowerCase())}.${ext}`;

  return uploadToSupabase(
    {
      bucket: 'profiles',
      content: media.content,
      filePath,
      mimeType: media.mime,
    },
    { upsert: true }
  );
}
