'use client'

// Widget registry — maps each FieldWidget kind to the component that renders it.
// BriefForm renders fields by looking their widget up here, so registering a new
// widget (add a kind + a component) makes it available to the registry-driven form.
import { useId, type ComponentType } from 'react'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ProductRows } from './product-rows'
import { ASPECT_RATIOS, type AspectRatio } from '@/features/brief/schema'
import type { BriefFormState } from '@/features/brief/from-form'
import type { FieldDef, FieldWidget } from '@/features/brief/field-registry'

export interface WidgetProps {
  def: FieldDef
  state: BriefFormState
  update: (key: keyof BriefFormState, value: BriefFormState[keyof BriefFormState]) => void
}

function TextWidget({ def, state, update }: WidgetProps) {
  const value = state[def.key]
  const current = typeof value === 'string' ? value : ''
  return (
    <Field label={def.label} required={def.required} hint={def.hint}>
      {({ inputId, describedBy }) => (
        <div className="flex flex-col gap-2">
          <Input
            id={inputId}
            aria-describedby={describedBy}
            value={current}
            onChange={(e) => update(def.key, e.target.value)}
            placeholder={def.placeholder}
          />
          {def.suggestions && def.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {def.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={current === s}
                  onClick={() => update(def.key, current === s ? '' : s)}
                  className="border-border text-muted-foreground hover:border-brand-cyan hover:text-foreground aria-pressed:border-brand-cyan aria-pressed:text-foreground border px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  )
}

function ProductsWidget({ state, update }: WidgetProps) {
  return (
    <ProductRows products={state.products} onChange={(products) => update('products', products)} />
  )
}

function RatiosWidget({ def, state, update }: WidgetProps) {
  const hintId = useId()
  function toggle(r: AspectRatio) {
    const next = state.aspect_ratios.includes(r)
      ? state.aspect_ratios.filter((x) => x !== r)
      : [...state.aspect_ratios, r]
    update('aspect_ratios', next)
  }
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={def.hint ? hintId : undefined}>
      <legend className="text-sm font-medium">{def.label}</legend>
      <div className="flex flex-wrap gap-4">
        {ASPECT_RATIOS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.aspect_ratios.includes(r)}
              onChange={() => toggle(r)}
              className="h-4 w-4 focus-visible:ring-2 focus-visible:ring-offset-2"
            />
            {r}
          </label>
        ))}
      </div>
      {def.hint && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {def.hint}
        </p>
      )}
    </fieldset>
  )
}

function SelectWidget({ def, state, update }: WidgetProps) {
  const value = state[def.key]
  return (
    <Field label={def.label} required={def.required} hint={def.hint}>
      {({ inputId, describedBy }) => (
        <Select
          id={inputId}
          aria-describedby={describedBy}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => update(def.key, e.target.value)}
        >
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  )
}

export const WIDGETS: Record<FieldWidget, ComponentType<WidgetProps>> = {
  text: TextWidget,
  products: ProductsWidget,
  ratios: RatiosWidget,
  select: SelectWidget,
}

/** Render one registry field via its registered widget. */
export function DynamicField(props: WidgetProps) {
  const Widget = WIDGETS[props.def.widget]
  return <Widget {...props} />
}
