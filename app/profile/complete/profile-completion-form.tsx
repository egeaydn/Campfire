'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateProfile, checkUsername } from '@/app/actions/profile';
import { Loader2, Check, X } from 'lucide-react';
import { AvatarUpload } from './avatar-upload';

export function ProfileCompletionForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState('');

  // Debounced username check
  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setError('');

    // Username validation
    if (!value) {
      setUsernameStatus('idle');
      return;
    }

    if (value.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setError('Username can only contain letters, numbers, and underscores');
      setUsernameStatus('taken');
      return;
    }

    setUsernameStatus('checking');

    // Check availability
    try {
      const { available } = await checkUsername(value);
      setUsernameStatus(available ? 'available' : 'taken');
      if (!available) {
        setError('Username is already taken');
      }
    } catch (err) {
      setUsernameStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameStatus !== 'available') {
      setError('Please choose a valid and available username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfile({
        username,
        display_name: displayName || username,
        bio
      });

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Set up your profile to start using Campfire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <AvatarUpload />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="johndoe"
                required
                minLength={3}
                maxLength={20}
                className="pr-10"
              />
              <div className="absolute right-3 top-3">
                {usernameStatus === 'checking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === 'available' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {usernameStatus === 'taken' && (
                  <X className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Optional - will default to your username
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/200
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || usernameStatus !== 'available'}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
