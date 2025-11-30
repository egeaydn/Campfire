import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProfileCompletionForm } from './profile-completion-form';

export default async function ProfileCompletePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if profile is already complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (profile?.username) {
    redirect('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <ProfileCompletionForm />
    </main>
  );
}
