import supabase from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
const MEDIA_BUCKET = 'review-photos';

export async function uploadPhoto(img) {
  try {
    const base64 = await FileSystem.readAsStringAsync(img.uri, {
      encoding: 'base64',
    });
    const filePath = `${new Date().getTime()}.${
      img.type === 'image' ? 'jpg' : 'mp4'
    }`;
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(filePath, decode(base64), {
        contentType: img.type === 'image' ? 'image/jpeg' : 'video/mp3',
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
