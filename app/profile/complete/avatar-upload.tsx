'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatar } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';

export function AvatarUpload() {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { url } = await uploadAvatar(formData);
      setAvatarUrl(url);
      router.refresh();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.message || 'Failed to upload avatar');
      setAvatarUrl('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <Avatar className="w-32 h-32">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="bg-muted">
          <Camera className="w-12 h-12 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute bottom-0 right-0 rounded-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
