import supabase from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const MEDIA_BUCKET = 'review-photos';

export async function uploadMedia(media) {
  try {
    console.log('inside uploadPhoto fx');
    const base64 = await FileSystem.readAsStringAsync(media.uri, {
      encoding: 'base64',
    });
    const filePath = `${new Date().getTime()}.${
      media.type === 'image' ? 'jpg' : 'mp4'
    }`;
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(filePath, decode(base64), {
        contentType: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
      });

    if (error)
      return {
        success: false,
        source: 'supabase',
        message: 'uploadPhoto: ' + error.message,
      };

    const { data: urlData } = await supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, message: err.message };
  }
}
