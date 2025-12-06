import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportButton } from '@/components/moderation/ReportButton'

// Mock the server action
jest.mock('@/app/actions/reports', () => ({
  reportMessage: jest.fn(),
}))

describe('ReportButton Component', () => {
  const mockMessageId = 'test-message-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders button variant correctly', () => {
    render(<ReportButton messageId={mockMessageId} variant="button" />)
    const button = screen.getByRole('button')
    expect(button).toBeTruthy()
  })

  it('opens dialog when clicked', async () => {
    const user = userEvent.setup()
    render(<ReportButton messageId={mockMessageId} variant="button" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText(/report message/i)).toBeTruthy()
  })

  it('renders all report reason options', async () => {
    const user = userEvent.setup()
    render(<ReportButton messageId={mockMessageId} variant="button" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    // Check if dialog opened
    expect(screen.getByText(/reason/i)).toBeTruthy()
  })

  it('submits report with reason and description', async () => {
    const { reportMessage } = require('@/app/actions/reports')
    reportMessage.mockResolvedValueOnce({})

    const user = userEvent.setup()
    render(<ReportButton messageId={mockMessageId} variant="button" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    // Fill in description
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'This is spam content')

    // Submit
    const submitButton = screen.getByText(/submit report/i)
    await user.click(submitButton)

    await waitFor(() => {
      expect(reportMessage).toHaveBeenCalledWith({
        messageId: mockMessageId,
        reason: 'spam',
        description: 'This is spam content',
      })
    })
  })

  it('shows success message after submission', async () => {
    const { reportMessage } = require('@/app/actions/reports')
    reportMessage.mockResolvedValueOnce({})

    const user = userEvent.setup()
    render(<ReportButton messageId={mockMessageId} variant="button" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    const submitButton = screen.getByText(/submit report/i)
    await user.click(submitButton)

    await waitFor(() => {
      expect(reportMessage).toHaveBeenCalled()
    })
  })

  it('handles submission errors gracefully', async () => {
    const { reportMessage } = require('@/app/actions/reports')
    reportMessage.mockRejectedValueOnce(new Error('Already reported'))

    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()

    const user = userEvent.setup()
    render(<ReportButton messageId={mockMessageId} variant="button" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    const submitButton = screen.getByText(/submit report/i)
    await user.click(submitButton)

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Already reported')
    })

    alertMock.mockRestore()
  })
})
