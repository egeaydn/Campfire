'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchUsers(query: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Search for users by username (exclude current user)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .neq('id', user.sub)
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return profiles;
}
