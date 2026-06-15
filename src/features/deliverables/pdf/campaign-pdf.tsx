// Deliverable #1 — the primary client-facing master PDF. A cover (logo, campaign
// name, message, palette) followed by one page per product, each laying out the
// product's creatives with a ratio/dimensions/source caption. Auto-flows across
// pages. Pure: takes loaded logo + creative bytes, returns PDF bytes.
import { Document, Page, View, Text, Image as PdfImage, renderToBuffer } from '@react-pdf/renderer'
import { registerDeliverableFonts } from './register-fonts'
import { buildStyles } from './theme'
import { pngDataUri } from './images'
import type { DeliverableBrandKit, DeliverableProduct } from '../types'

export interface CampaignPdfArgs {
  brand: DeliverableBrandKit
  logo: Uint8Array
  products: DeliverableProduct[]
}

export async function buildCampaignPdf(args: CampaignPdfArgs): Promise<Uint8Array> {
  registerDeliverableFonts()
  const { brand, logo, products } = args
  const styles = buildStyles(brand)
  const logoUri = pngDataUri(logo)

  const doc = (
    <Document title={`${brand.campaignName} — creatives`} author="TheTechMargin">
      <Page size="A4" style={styles.page}>
        <PdfImage style={styles.logo} src={logoUri} />
        <Text style={styles.coverTitle}>{brand.campaignName}</Text>
        <Text style={styles.coverMessage}>{brand.message}</Text>
        <Text style={styles.meta}>Region: {brand.region}</Text>
        <Text style={styles.meta}>Audience: {brand.audience}</Text>
        {brand.locale ? <Text style={styles.meta}>Locale: {brand.locale}</Text> : null}
        {brand.palette.length > 0 && (
          <View style={styles.swatchRow}>
            {brand.palette.map((hex) => (
              <View key={hex} style={styles.swatch}>
                <View style={[styles.swatchChip, { backgroundColor: hex }]} />
                <Text style={styles.swatchHex}>{hex}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>

      {products.map((product) => (
        <Page key={product.productSlug} size="A4" style={styles.page} wrap>
          <Text style={styles.h2}>{product.productName}</Text>
          <View style={styles.grid}>
            {product.creatives.map((creative, i) => (
              <View key={`${creative.ratio}-${i}`} style={styles.cell} wrap={false}>
                <PdfImage style={styles.creativeImg} src={pngDataUri(creative.png)} />
                <Text style={styles.caption}>
                  {creative.ratio} · {creative.width ?? '?'}×{creative.height ?? '?'} ·{' '}
                  {creative.source}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.footer} fixed>
            {brand.campaignName} · © TheTechMargin
          </Text>
        </Page>
      ))}
    </Document>
  )

  return renderToBuffer(doc)
}
