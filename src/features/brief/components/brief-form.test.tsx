import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { ReactElement } from 'react'
import { BriefForm } from './brief-form'
import { ToastProvider } from '@/components/feedback/toast'
import { emptyBriefForm, type BriefFormState } from '@/features/brief/from-form'

// The product asset picker reports upload results via the toast context.
const renderForm = (ui: ReactElement) => render(<ToastProvider>{ui}</ToastProvider>)

function filledState(): BriefFormState {
  return {
    campaign_name: 'Test Campaign',
    products: [
      {
        name: 'Alpha',
        description: 'First product',
        input_assets: 'alpha.png',
        creative_direction: '',
      },
      { name: 'Beta', description: 'Second product', input_assets: '', creative_direction: '' },
    ],
    target_region: 'Japan',
    target_audience: 'Urban women, 25-40',
    campaign_message: 'Glow on',
    locale: 'ja-JP',
    brand_palette: '#E904E5, #09FFF0',
    image_model: 'openai',
    aspect_ratios: ['1:1', '9:16', '16:9'],
  }
}

describe('BriefForm (registry-driven)', () => {
  it('renders registry fields and submits a valid brief from prefilled state', () => {
    const onValidBrief = vi.fn()
    renderForm(<BriefForm onValidBrief={onValidBrief} pending={false} initial={filledState()} />)

    // Dynamic text widgets rendered from the registry, bound to state.
    expect(screen.getByLabelText(/Campaign name/i)).toHaveValue('Test Campaign')
    expect(screen.getByLabelText(/Target region/i)).toHaveValue('Japan')
    expect(screen.getByLabelText(/Locale/i)).toHaveValue('ja-JP')
    expect(screen.getByLabelText(/Brand palette/i)).toHaveValue('#E904E5, #09FFF0')
    // Custom widgets (registered) also present.
    expect(screen.getByText('Aspect ratios')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Generate creatives/i }))

    expect(onValidBrief).toHaveBeenCalledTimes(1)
    expect(onValidBrief.mock.calls[0]![0]).toMatchObject({
      campaign_name: 'Test Campaign',
      target_region: 'Japan',
      locale: 'ja-JP',
      brand_palette: ['#E904E5', '#09FFF0'],
      aspect_ratios: ['1:1', '9:16', '16:9'],
      products: [
        { name: 'Alpha', description: 'First product', input_assets: ['alpha.png'] },
        { name: 'Beta', description: 'Second product', input_assets: [] },
      ],
    })
  })

  it('shows validation errors instead of submitting an empty brief', () => {
    const onValidBrief = vi.fn()
    renderForm(<BriefForm onValidBrief={onValidBrief} pending={false} initial={emptyBriefForm()} />)
    fireEvent.click(screen.getByRole('button', { name: /Generate creatives/i }))
    expect(onValidBrief).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i)
  })

  it('has no axe accessibility violations', async () => {
    const { container } = renderForm(
      <BriefForm onValidBrief={vi.fn()} pending={false} initial={filledState()} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
