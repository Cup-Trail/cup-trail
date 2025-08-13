import supabase from './supabase.js';

export async function getCurrentUserId() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return {
        success: false,
        source: 'supabase',
        message: error?.message || 'No user found.',
        code: error?.code || 'unauthenticated',
      };
    }
    return {
      success: true,
      data: data.user.id,
    };
  } catch (err) {
    console.error('[Exception]', err.message);
    return { success: false, source: 'exception', message: err.message };
  }
}
