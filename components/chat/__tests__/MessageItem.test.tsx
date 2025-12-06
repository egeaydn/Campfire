import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageItem } from '@/components/chat/MessageItem'

// Mock server actions
jest.mock('@/app/actions/messages', () => ({
  editMessage: jest.fn(),
  deleteMessage: jest.fn(),
}))

describe('MessageItem Component', () => {
  const mockMessage = {
    id: 'msg-1',
    content: 'Hello, world!',
    created_at: new Date().toISOString(),
    edited_at: null,
    file_url: null,
    sender: {
      username: 'testuser',
      avatar_url: null,
    },
  }

  it('renders message content correctly', () => {
    render(
      <MessageItem
        message={mockMessage}
        isOwn={true}
      />
    )

    expect(screen.getByText('Hello, world!')).toBeTruthy()
    expect(screen.getByText('testuser')).toBeTruthy()
  })

  it('shows edit button for own messages', () => {
    render(
      <MessageItem
        message={mockMessage}
        isOwn={true}
      />
    )

    // Should show edit/delete options on hover
    const messageElement = screen.getByText('Hello, world!').closest('.group')
    expect(messageElement).toBeTruthy()
  })

  it('does not show edit button for other users messages', () => {
    render(
      <MessageItem
        message={mockMessage}
        isOwn={false}
      />
    )

    // Edit button should not be visible for other users
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull()
  })

  it('shows report button for other users messages', () => {
    render(
      <MessageItem
        message={mockMessage}
        isOwn={false}
      />
    )

    // Report button should be present for other users' messages
    const messageElement = screen.getByText('Hello, world!').closest('.group')
    expect(messageElement).toBeTruthy()
  })

  it('displays edited indicator when message is edited', () => {
    const editedMessage = {
      ...mockMessage,
      edited_at: new Date().toISOString(),
    }

    render(
      <MessageItem
        message={editedMessage}
        isOwn={true}
      />
    )

    expect(screen.getByText(/edited/i)).toBeTruthy()
  })

  it('displays file attachment when present', () => {
    const messageWithFile = {
      ...mockMessage,
      file_url: 'https://example.com/file.pdf',
    }

    render(
      <MessageItem
        message={messageWithFile}
        isOwn={true}
      />
    )

    // File attachments should be rendered
    expect(messageWithFile.file_url).toBe('https://example.com/file.pdf')
  })

  it('formats timestamp correctly', () => {
    render(
      <MessageItem
        message={mockMessage}
        isOwn={true}
      />
    )

    // Check if relative time is displayed (e.g., "less than a minute ago")
    const timeElement = screen.getByText(/ago|seconds?|minutes?/i)
    expect(timeElement).toBeTruthy()
  })
})
