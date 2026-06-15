// Deliverable #3 — a one-page branded spec sheet for a single creative: the image
// plus ratio/dimensions/source and the compliance results table. Pure.
import { Document, Page, View, Text, Image as PdfImage, renderToBuffer } from '@react-pdf/renderer'
import { registerDeliverableFonts } from './register-fonts'
import { buildStyles, STATUS_COLOR } from './theme'
import { pngDataUri } from './images'
import type { DeliverableBrandKit, EmbeddableCreative } from '../types'

export interface SpecSheetPdfArgs {
  brand: DeliverableBrandKit
  logo: Uint8Array
  creative: EmbeddableCreative
}

export async function buildSpecSheetPdf(args: SpecSheetPdfArgs): Promise<Uint8Array> {
  registerDeliverableFonts()
  const { brand, logo, creative } = args
  const styles = buildStyles(brand)

  const doc = (
    <Document title={`${creative.productName} ${creative.ratio} — spec`} author="TheTechMargin">
      <Page size="A4" style={styles.page}>
        <PdfImage style={styles.logo} src={pngDataUri(logo)} />
        <Text style={styles.h2}>
          {creative.productName} · {creative.ratio}
        </Text>
        <PdfImage style={styles.specImg} src={pngDataUri(creative.png)} />

        <View style={styles.specRow}>
          <Text style={styles.specKey}>Aspect ratio</Text>
          <Text style={styles.specVal}>{creative.ratio}</Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Dimensions</Text>
          <Text style={styles.specVal}>
            {creative.width ?? '?'} × {creative.height ?? '?'} px
          </Text>
        </View>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Source</Text>
          <Text style={styles.specVal}>{creative.source}</Text>
        </View>

        <Text style={[styles.h3, { marginTop: 20 }]}>Compliance</Text>
        {creative.compliance.length > 0 ? (
          creative.compliance.map((check, i) => (
            <View key={`${check.check}-${i}`} style={styles.complianceRow}>
              <Text style={styles.complianceCheck}>{check.check}</Text>
              <Text style={[styles.complianceStatus, { color: STATUS_COLOR[check.status] }]}>
                {check.status}
              </Text>
              <Text style={styles.complianceDetail}>{check.detail}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.meta}>No compliance checks recorded.</Text>
        )}
        <Text style={styles.footer} fixed>
          {brand.campaignName} · © TheTechMargin
        </Text>
      </Page>
    </Document>
  )

  return renderToBuffer(doc)
}
