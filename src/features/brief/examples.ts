// Example campaign briefs used by the in-app help guide. These mirror the
// canonical files in examples/ (brief.summer-glow.json, brief.morning-fuel.json);
// examples.test.ts asserts they stay in sync so the inlined copies can't drift.
// Inlined (not fs-read) so both the server help page and /campaigns/new can use
// them without runtime file access.
import type { Brief } from './schema'

export interface ExampleBrief {
  slug: string
  title: string
  summary: string
  /** Plain-language reuse-vs-generate explanation for the guide. */
  reuseNote: string
  brief: Brief
}

export const EXAMPLES: ExampleBrief[] = [
  {
    slug: 'summer-glow',
    title: 'Summer Glow 2026',
    summary:
      'A skincare launch for Japan with a localized (ja-JP) message overlay and a neon brand palette.',
    reuseNote:
      'HydraBoost Serum reuses an uploaded hero (serum-front.png); SunShield SPF50 has no asset, so the image model generates one.',
    brief: {
      campaign_name: 'Summer Glow 2026',
      products: [
        {
          name: 'HydraBoost Serum',
          description:
            'Lightweight hydrating facial serum with hyaluronic acid for a dewy, all-day glow',
          input_assets: ['serum-front.png'],
        },
        {
          name: 'SunShield SPF50',
          description: 'Daily mineral sunscreen, reef-safe, no white cast, weightless finish',
          input_assets: [],
        },
      ],
      target_region: 'Japan',
      target_audience:
        'Urban women, 25-40, skincare-conscious, value clean ingredients and minimalist routines',
      campaign_message: 'Glow that lasts all day',
      locale: 'ja-JP',
      brand_palette: ['#E904E5', '#09FFF0', '#a1ff00'],
      image_model: 'openai',
      aspect_ratios: ['1:1', '9:16', '16:9'],
    },
  },
  {
    slug: 'morning-fuel',
    title: 'Morning Fuel — Q3 Launch',
    summary:
      'A beverage launch for Germany (de-DE) targeting busy commuters, with a warm brand palette.',
    reuseNote:
      'BrewBox Cold Brew reuses an uploaded hero (brewbox-can.png); OatRise Barista Oat Milk has no asset, so the image model generates one.',
    brief: {
      campaign_name: 'Morning Fuel — Q3 Launch',
      products: [
        {
          name: 'BrewBox Cold Brew',
          description: 'Ready-to-drink cold brew coffee, smooth low-acid blend, no added sugar',
          input_assets: ['brewbox-can.png'],
        },
        {
          name: 'OatRise Barista Oat Milk',
          description: 'Barista-grade oat milk that froths like dairy, neutral taste, plant-based',
          input_assets: [],
        },
      ],
      target_region: 'Germany',
      target_audience: 'Commuters and remote workers, 22-38, busy mornings, sustainability-minded',
      campaign_message: 'Your best morning, on repeat',
      locale: 'de-DE',
      brand_palette: ['#ff9500', '#a1ff00'],
      image_model: 'openai',
      aspect_ratios: ['1:1', '9:16', '16:9'],
    },
  },
]

export function getExample(slug: string | undefined): ExampleBrief | undefined {
  if (!slug) return undefined
  return EXAMPLES.find((e) => e.slug === slug)
}
