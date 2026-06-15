// Shared @react-pdf StyleSheet derived from the brand kit. Colors come from the
// campaign palette (brand.primary / brand.textColor) — no hardcoded brand hues.
import { StyleSheet } from '@react-pdf/renderer'
import type { DeliverableBrandKit } from '../types'

const INK = '#1a1a1a'
const MUTED = '#666666'
const HAIRLINE = '#e5e5e5'

export function buildStyles(brand: DeliverableBrandKit) {
  return StyleSheet.create({
    page: {
      paddingVertical: 48,
      paddingHorizontal: 44,
      fontFamily: 'Poppins',
      color: INK,
      backgroundColor: '#ffffff',
      fontSize: 11,
    },
    logo: { width: 120, height: 40, objectFit: 'contain', marginBottom: 28 },
    coverTitle: { fontSize: 30, color: brand.primary, marginBottom: 10 },
    coverMessage: { fontSize: 16, color: INK, marginBottom: 18 },
    meta: { fontSize: 11, color: MUTED, marginBottom: 4 },
    h2: { fontSize: 18, color: brand.primary, marginBottom: 14 },
    h3: { fontSize: 13, color: INK, marginBottom: 6 },
    swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
    swatch: { width: 96 },
    swatchChip: { height: 48, borderRadius: 4, borderWidth: 1, borderColor: HAIRLINE },
    swatchHex: { fontSize: 9, color: MUTED, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    cell: { width: '46%' },
    creativeImg: {
      width: '100%',
      objectFit: 'contain',
      borderWidth: 1,
      borderColor: HAIRLINE,
      borderRadius: 4,
    },
    caption: { fontSize: 9, color: MUTED, marginTop: 4 },
    specImg: {
      width: '100%',
      objectFit: 'contain',
      borderWidth: 1,
      borderColor: HAIRLINE,
      borderRadius: 4,
      marginBottom: 16,
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: HAIRLINE,
      paddingVertical: 5,
    },
    specKey: { fontSize: 10, color: MUTED },
    specVal: { fontSize: 10, color: INK },
    complianceRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: HAIRLINE,
      paddingVertical: 5,
    },
    complianceCheck: { width: '35%', fontSize: 10, color: INK },
    complianceStatus: { width: '15%', fontSize: 10 },
    complianceDetail: { width: '50%', fontSize: 9, color: MUTED },
    footer: { position: 'absolute', bottom: 24, left: 44, right: 44, fontSize: 8, color: MUTED },
  })
}

/** Status → token-ish color for the compliance table (pass/warn/fail). */
export const STATUS_COLOR: Record<string, string> = {
  pass: '#1a7f37',
  warn: '#9a6700',
  fail: '#b3261e',
}
