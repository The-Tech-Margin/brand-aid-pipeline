// Creative browser — outputs grouped by product → aspect ratio, with ZIP export.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCampaignCreatives } from '@/features/creatives/creatives'
import { CreativeBrowser } from '@/features/creatives/components/creative-browser'

export default async function CreativesPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params
  const data = await getCampaignCreatives(campaignId)
  if (!data) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
          <span className="gradient-text">{data.campaignName}</span>
        </h1>
        <p className="text-muted-foreground text-sm">Creatives by product and aspect ratio</p>
      </div>
      <CreativeBrowser campaignId={campaignId} data={data} />
    </div>
  )
}
