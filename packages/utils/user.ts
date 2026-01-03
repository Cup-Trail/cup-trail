import { supabase } from '@cuptrail/utils'; 
import { type User } from '@cuptrail/core';

export const getUser: () => Promise<User | null> = async () => {
  return await supabase.auth.getUser().then(({ data, error }) => {
    if (error || !data.user) {
      return null;
    }
    return data.user as User
  });
}