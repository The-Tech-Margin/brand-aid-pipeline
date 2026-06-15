import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { ReactElement } from 'react'
import { Button } from './button'
import { Card, CardTitle } from './card'
import { Field } from './field'
import { Input } from './input'
import { EditorToolbar } from '@/features/editor/editor-toolbar'
import NotFound from '@/app/not-found'

const noop = () => {}

async function expectNoViolations(ui: ReactElement) {
  const { container } = render(ui)
  expect(await axe(container)).toHaveNoViolations()
}

describe('accessibility (jest-axe smoke)', () => {
  it('Button', async () => {
    await expectNoViolations(<Button>Save</Button>)
  })

  it('Field + Input (label associated)', async () => {
    await expectNoViolations(
      <Field label="Email" required>
        {({ inputId }) => <Input id={inputId} name="email" type="email" />}
      </Field>,
    )
  })

  it('Card + CardTitle', async () => {
    await expectNoViolations(
      <Card>
        <CardTitle>Summary</CardTitle>
      </Card>,
    )
  })

  it('404 page', async () => {
    await expectNoViolations(<NotFound />)
  })

  it('EditorToolbar (no selection / not saved)', async () => {
    await expectNoViolations(
      <EditorToolbar
        palette={['#E904E5', '#09FFF0']}
        busy={false}
        hasSelection={false}
        canGenerate
        canEditImage={false}
        onAddText={noop}
        onAddLogo={noop}
        onSetFill={noop}
        onDeleteSelected={noop}
        onRemoveBg={noop}
        onGenerative={noop}
        onSave={noop}
      />,
    )
  })

  it('EditorToolbar (selection + editable)', async () => {
    await expectNoViolations(
      <EditorToolbar
        palette={['#E904E5']}
        busy={false}
        hasSelection
        canGenerate
        canEditImage
        onAddText={noop}
        onAddLogo={noop}
        onSetFill={noop}
        onDeleteSelected={noop}
        onRemoveBg={noop}
        onGenerative={noop}
        onSave={noop}
      />,
    )
  })
})
