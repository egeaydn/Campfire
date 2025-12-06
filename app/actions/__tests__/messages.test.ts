import { createClient } from '@/lib/supabase/server'
import { sendMessage, editMessage, deleteMessage } from '@/app/actions/messages'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Message Actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getClaims: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('sends a message successfully', async () => {
      const mockUser = { claims: { sub: 'user-123' } }
      mockSupabase.auth.getClaims.mockResolvedValue({ data: mockUser })

      const mockMessage = {
        id: 'msg-1',
        content: 'Hello',
        sender_id: 'user-123',
        conversation_id: 'conv-1',
      }

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({ data: mockMessage, error: null })

      const result = await sendMessage({
        conversationId: 'conv-1',
        content: 'Hello',
      })

      expect(result).toEqual(mockMessage)
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
    })

    it('throws error when user is not authenticated', async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({ data: null })

      await expect(
        sendMessage({
          conversationId: 'conv-1',
          content: 'Hello',
        })
      ).rejects.toThrow('Unauthorized')
    })

    it('handles file uploads', async () => {
      const mockUser = { claims: { sub: 'user-123' } }
      mockSupabase.auth.getClaims.mockResolvedValue({ data: mockUser })

      const mockMessage = {
        id: 'msg-1',
        file_url: 'https://example.com/file.pdf',
        sender_id: 'user-123',
        conversation_id: 'conv-1',
      }

      mockSupabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({ data: mockMessage, error: null })

      const result = await sendMessage({
        conversationId: 'conv-1',
        fileUrl: 'https://example.com/file.pdf',
      })

      expect(result.file_url).toBe('https://example.com/file.pdf')
    })
  })

  describe('editMessage', () => {
    it('edits own message successfully', async () => {
      const mockUser = { claims: { sub: 'user-123' } }
      mockSupabase.auth.getClaims.mockResolvedValue({ data: mockUser })

      const mockEditedMessage = {
        id: 'msg-1',
        content: 'Edited message',
        edited_at: new Date().toISOString(),
      }

      mockSupabase
        .from()
        .update()
        .eq()
        .eq()
        .select()
        .single.mockResolvedValue({ data: mockEditedMessage, error: null })

      const result = await editMessage('msg-1', 'Edited message')

      expect(result).toEqual(mockEditedMessage)
    })

    it('throws error when editing unauthorized message', async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({ data: null })

      await expect(editMessage('msg-1', 'Edited')).rejects.toThrow('Unauthorized')
    })
  })

  describe('deleteMessage', () => {
    it('deletes own message successfully', async () => {
      const mockUser = { claims: { sub: 'user-123' } }
      mockSupabase.auth.getClaims.mockResolvedValue({ data: mockUser })

      mockSupabase.from().delete().eq().eq.mockResolvedValue({ error: null })

      await expect(deleteMessage('msg-1')).resolves.not.toThrow()
    })

    it('prevents deleting other users messages', async () => {
      const mockUser = { claims: { sub: 'user-123' } }
      mockSupabase.auth.getClaims.mockResolvedValue({ data: mockUser })

      mockSupabase
        .from()
        .delete()
        .eq()
        .eq.mockResolvedValue({ error: { message: 'Forbidden' } })

      await expect(deleteMessage('msg-1')).rejects.toThrow()
    })
  })
})
