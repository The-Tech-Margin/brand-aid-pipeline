'use client'

// Add/remove product rows for the brief form. Enforces the schema's two-product
// minimum by disabling remove at the floor.
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PlusIcon, TrashIcon } from '@/components/icons'
import { emptyProduct, type ProductFormInput } from '@/features/brief/from-form'
import { AssetField } from './asset-field'
import { useAssetLibrary } from '@/features/brief/assets/use-asset-library'

// Quick-start art directions for the AI hero. Clicking one fills the field; users can
// then edit. They only affect the generate path (ignored when an asset is reused).
const DIRECTION_PRESETS = [
  'Studio product shot on a seamless background',
  'Lifestyle scene in natural daylight',
  'Minimal top-down flat-lay',
  'Bold vibrant gradient backdrop',
  'Outdoor, in-use lifestyle moment',
]

interface ProductRowsProps {
  products: ProductFormInput[]
  onChange: (next: ProductFormInput[]) => void
  minProducts?: number
}

export function ProductRows({ products, onChange, minProducts = 1 }: ProductRowsProps) {
  const { library, refresh } = useAssetLibrary()
  const update = (i: number, patch: Partial<ProductFormInput>) =>
    onChange(products.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Products{' '}
          <span className="text-muted-foreground font-normal">(at least {minProducts})</span>
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...products, emptyProduct()])}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add product
        </Button>
      </div>

      {products.map((p, i) => (
        <div
          key={i}
          className="border-border bg-muted/30 flex flex-col gap-3 border p-3"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Product {i + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(products.filter((_, idx) => idx !== i))}
              disabled={products.length <= minProducts}
              aria-label={`Remove product ${i + 1}`}
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <Field label="Name" required>
            {({ inputId, describedBy }) => (
              <Input
                id={inputId}
                aria-describedby={describedBy}
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="HydraBoost Serum"
              />
            )}
          </Field>
          <Field label="Description" hint="Optional — sharpens the AI hero prompt">
            {({ inputId, describedBy }) => (
              <Input
                id={inputId}
                aria-describedby={describedBy}
                value={p.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Lightweight hydrating facial serum"
              />
            )}
          </Field>
          <Field
            label="Creative direction"
            hint="Optional — guides the AI hero. Ignored when you reuse your own asset below."
          >
            {({ inputId, describedBy }) => (
              <div className="flex flex-col gap-2">
                <Input
                  id={inputId}
                  aria-describedby={describedBy}
                  value={p.creative_direction}
                  onChange={(e) => update(i, { creative_direction: e.target.value })}
                  maxLength={300}
                  placeholder="Studio product shot, soft daylight, pastel background"
                />
                <div className="flex flex-wrap gap-1.5">
                  {DIRECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        update(i, {
                          creative_direction: p.creative_direction === preset ? '' : preset,
                        })
                      }
                      aria-pressed={p.creative_direction === preset}
                      className="border-border text-muted-foreground hover:border-brand-cyan hover:text-foreground aria-pressed:border-brand-cyan aria-pressed:text-foreground border px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Field>
          <AssetField
            value={p.input_assets}
            onChange={(v) => update(i, { input_assets: v })}
            library={library}
            onUploaded={refresh}
          />
        </div>
      ))}
    </div>
  )
}
