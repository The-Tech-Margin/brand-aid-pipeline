// Deliverable #2 — a one-page brand style sheet: logo, palette swatches each
// labeled with its hex, a Poppins specimen, and the campaign message/voice. Pure.
import { Document, Page, View, Text, Image as PdfImage, renderToBuffer } from '@react-pdf/renderer'
import { registerDeliverableFonts } from './register-fonts'
import { buildStyles } from './theme'
import { pngDataUri } from './images'
import type { DeliverableBrandKit } from '../types'

export interface BrandSheetPdfArgs {
  brand: DeliverableBrandKit
  logo: Uint8Array
}

export async function buildBrandSheetPdf(args: BrandSheetPdfArgs): Promise<Uint8Array> {
  registerDeliverableFonts()
  const { brand, logo } = args
  const styles = buildStyles(brand)

  const doc = (
    <Document title={`${brand.campaignName} — brand sheet`} author="TheTechMargin">
      <Page size="A4" style={styles.page}>
        <PdfImage style={styles.logo} src={pngDataUri(logo)} />
        <Text style={styles.coverTitle}>{brand.campaignName}</Text>
        <Text style={styles.coverMessage}>{brand.message}</Text>

        <Text style={[styles.h3, { marginTop: 20 }]}>Palette</Text>
        {brand.palette.length > 0 ? (
          <View style={styles.swatchRow}>
            {brand.palette.map((hex) => (
              <View key={hex} style={styles.swatch}>
                <View style={[styles.swatchChip, { backgroundColor: hex }]} />
                <Text style={styles.swatchHex}>{hex}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.meta}>No brand palette supplied for this campaign.</Text>
        )}

        <Text style={[styles.h3, { marginTop: 24 }]}>Typeface — Poppins</Text>
        <Text style={{ fontSize: 28, color: brand.primary }}>Aa Bb Cc Dd Ee</Text>
        <Text style={{ fontSize: 14 }}>The quick brown fox jumps over the lazy dog</Text>

        <Text style={[styles.h3, { marginTop: 24 }]}>Voice</Text>
        <Text style={styles.meta}>Region: {brand.region}</Text>
        <Text style={styles.meta}>Audience: {brand.audience}</Text>
        <Text style={[styles.coverMessage, { marginTop: 8 }]}>“{brand.message}”</Text>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
