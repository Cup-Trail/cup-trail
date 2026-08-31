import { type User } from '@cuptrail/core';

import { supabase } from '@cuptrail/utils';

export const getUser: () => Promise<User | null> = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user as User;
};
