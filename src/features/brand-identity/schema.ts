import { z } from 'zod'

// Logo is referenced by the uploaded filename (same safe-filename rule as input
// assets — it's joined into a private storage path and signed server-side).
export const brandInputSchema = z.object({
  businessName: z.string().trim().max(60).optional(),
  logoFilename: z
    .string()
    .max(80)
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, 'Invalid logo file name')
    .optional(),
  removeLogo: z.boolean().optional(),
  /** Decorative Google Fonts family; re-sanitized server-side before storage. */
  displayFont: z.string().max(50).optional(),
})
export type BrandInput = z.infer<typeof brandInputSchema>
