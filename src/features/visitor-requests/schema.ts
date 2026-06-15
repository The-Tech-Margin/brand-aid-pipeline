import { z } from 'zod'

// Public access-request form. Tight length caps + a control-char guard keep the inputs
// safe (defense against junk / header/log injection); email is normalized for the
// case-insensitive pending-dedupe index.
const noControlChars = (s: string) =>
  ![...s].some((ch) => {
    const code = ch.charCodeAt(0)
    return code < 0x20 || code === 0x7f
  })

export const accessRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(80, 'Name is too long.')
    .refine(noControlChars, 'Name contains invalid characters.'),
  organization: z
    .string()
    .trim()
    .min(1, 'Enter your organization.')
    .max(120, 'Organization is too long.')
    .refine(noControlChars, 'Organization contains invalid characters.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter your email.')
    .max(254, 'Email is too long.')
    .email('Enter a valid email address.'),
})

export type AccessRequestInput = z.infer<typeof accessRequestSchema>
