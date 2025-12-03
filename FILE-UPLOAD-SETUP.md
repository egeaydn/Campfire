# File Upload Feature - Setup Instructions

## ✅ Completed Implementation

### 1. Storage Bucket Setup
Run the SQL commands in `supabase-file-upload-setup.sql` in your Supabase SQL Editor:
- Creates `message-files` bucket (public)
- Sets up RLS policies for user uploads
- Enables public read access

### 2. New Files Created
- `app/actions/files.ts` - File upload server action
- `supabase-file-upload-setup.sql` - Database setup script

### 3. Updated Components
- `components/chat/Composer.tsx` - Added file picker, preview, and upload
- `components/chat/MessageItem.tsx` - Added image preview and file download

## 🎯 Features

### File Upload in Composer
- Click paperclip icon to select file
- Supports images (JPEG, PNG, GIF, WebP)
- Supports documents (PDF, DOC, DOCX)
- 10MB file size limit
- File preview before sending
- Optional caption/message with file
- Upload progress indicator

### File Display in Messages
- **Images**: Full preview, clickable to open in new tab
- **Documents**: Download button with file name
- Edit/delete for text messages
- Delete only for file-only messages

## 🚀 How to Use

1. **Run SQL Setup**
   ```sql
   -- Copy contents from supabase-file-upload-setup.sql
   -- Paste in Supabase Dashboard > SQL Editor > New Query
   -- Run the query
   ```

2. **Test Upload**
   - Go to any chat conversation
   - Click the paperclip icon
   - Select an image or document
   - Add optional caption
   - Click Send

3. **View Files**
   - Images display inline with messages
   - Documents show as downloadable cards
   - Click image to open full size
   - Click document card to download

## 📋 File Validation

- **Max Size**: 10MB per file
- **Image Types**: JPG, JPEG, PNG, GIF, WEBP
- **Document Types**: PDF, DOC, DOCX

## 🔒 Security

- Files stored in user-specific folders: `{userId}/{timestamp}.{ext}`
- RLS policies ensure users can only upload their own files
- Public read access for sharing in conversations
- File type validation on both client and server

## 🐛 Troubleshooting

### "Bucket not found" error
- Make sure you ran the SQL setup script
- Verify bucket exists in Storage dashboard

### Upload fails silently
- Check browser console for errors
- Verify file size < 10MB
- Ensure file type is allowed

### Image not displaying
- Check if URL is accessible
- Verify storage policies are correct
- Try opening URL directly in browser

## 📝 Next Steps

Optional enhancements:
- [ ] Image compression before upload
- [ ] Multiple file selection
- [ ] Drag & drop support
- [ ] Copy/paste images
- [ ] Video support
- [ ] File upload progress bar (detailed)
