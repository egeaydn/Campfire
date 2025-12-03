'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Paperclip, X, Image as ImageIcon, File } from 'lucide-react';
import { sendMessage } from '@/app/actions/messages';
import { uploadFile } from '@/app/actions/files';

interface ComposerProps {
  conversationId: string;
}

export function Composer({ conversationId }: ComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || sending) return;

    setSending(true);
    setUploading(!!selectedFile);

    try {
      let fileUrl: string | undefined;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const result = await uploadFile(formData);
        if (!result.success) {
          alert(result.error || 'Failed to upload file');
          return;
        }
        fileUrl = result.url;
      }

      // Send message
      await sendMessage({
        conversationId,
        content: content.trim() || undefined,
        fileUrl,
      });

      // Clear form
      setContent('');
      clearFile();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4">
      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 p-3 border rounded-lg bg-muted/50">
          <div className="flex items-start gap-3">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center bg-muted rounded">
                <File className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              onClick={clearFile}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={sending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          disabled={sending || !!selectedFile}
          className="h-[60px] w-[60px]"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message... (Shift+Enter for new line)"}
          className="min-h-[60px] max-h-[200px] resize-none"
          disabled={sending}
        />

        <Button 
          onClick={handleSend} 
          size="icon"
          disabled={(!content.trim() && !selectedFile) || sending}
          className="h-[60px] w-[60px]"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {uploading && (
        <p className="text-xs text-muted-foreground mt-2">
          Uploading file...
        </p>
      )}
    </div>
  );
}
