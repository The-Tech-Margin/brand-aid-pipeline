// Field registry — declarative description of every brief field the intake form
// renders. The form maps over this list and looks each entry's `widget` up in the
// widget registry (see components/field-widgets.tsx), so adding a brief field is a
// one-place change that renders automatically. field-registry.test.ts asserts this
// list stays in sync with the zod schema (keys + required), so the schema and UI
// can't drift — "auto update with changes".
import { IMAGE_MODELS, IMAGE_MODEL_LABELS } from '@/services/image/types'
import type { BriefFormState } from './from-form'

export type FieldWidget = 'text' | 'products' | 'ratios' | 'select'

export interface FieldDef {
  /** Key into BriefFormState (and the brief schema). */
  key: keyof BriefFormState
  label: string
  /** Which registered widget renders this field. */
  widget: FieldWidget
  /** Mirrors schema optionality (enforced by field-registry.test.ts). */
  required: boolean
  placeholder?: string
  hint?: string
  /** 'half' fields pair into a two-column row; default 'full'. */
  width?: 'full' | 'half'
  /** Options for the 'select' widget. */
  options?: { value: string; label: string }[]
  /** Quick-fill suggestion chips for a 'text' field. */
  suggestions?: string[]
}

export const BRIEF_FIELDS: FieldDef[] = [
  {
    key: 'campaign_name',
    label: 'Campaign name',
    widget: 'text',
    required: false,
    placeholder: 'Summer Glow 2026 (optional)',
  },
  { key: 'products', label: 'Products', widget: 'products', required: true },
  {
    key: 'target_region',
    label: 'Target region',
    widget: 'text',
    required: false,
    placeholder: 'Global',
    width: 'half',
    suggestions: ['Global', 'United States', 'Japan', 'Europe', 'United Kingdom'],
  },
  {
    key: 'locale',
    label: 'Locale',
    widget: 'text',
    required: false,
    placeholder: 'ja-JP',
    hint: 'e.g. ja-JP — drives the localized overlay',
    width: 'half',
  },
  {
    key: 'target_audience',
    label: 'Target audience',
    widget: 'text',
    required: false,
    placeholder: 'General audience',
    suggestions: [
      'General audience',
      'Urban women, 25–40',
      'Gen Z, mobile-first',
      'Eco-conscious millennials',
    ],
  },
  {
    key: 'campaign_message',
    label: 'Campaign message',
    widget: 'text',
    required: false,
    placeholder: 'Glow that lasts all day (optional)',
    suggestions: ['Glow that lasts all day', 'New season, new you', 'Made for you', 'Limited time'],
  },
  {
    key: 'brand_palette',
    label: 'Brand palette',
    widget: 'text',
    required: false,
    placeholder: '#E904E5, #09FFF0',
    hint: 'Optional hex colors (comma separated) for the color bar',
    width: 'half',
  },
  {
    key: 'image_model',
    label: 'Image model',
    widget: 'select',
    required: false,
    hint: 'Which provider generates the hero image',
    width: 'half',
    options: IMAGE_MODELS.map((id) => ({ value: id, label: IMAGE_MODEL_LABELS[id] })),
  },
  { key: 'aspect_ratios', label: 'Aspect ratios', widget: 'ratios', required: false },
]
