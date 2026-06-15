'use client'

// Client-side JSON + Markdown report download — the data is already on the page,
// so it builds the file in the browser (no server round trip). The blob URL is
// revoked right after the synthetic click.
import { Button } from '@/components/ui/button'
import { DownloadIcon } from '@/components/icons'
import { reportToJson, reportToMarkdown, type ReportData } from '@/features/runs/report'

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function RunDownload({ report }: { report: ReportData }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          downloadFile(`${report.runId}.json`, reportToJson(report), 'application/json')
        }
      >
        <DownloadIcon className="h-4 w-4" aria-hidden="true" />
        JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          downloadFile(`${report.runId}.md`, reportToMarkdown(report), 'text/markdown')
        }
      >
        <DownloadIcon className="h-4 w-4" aria-hidden="true" />
        Markdown
      </Button>
    </div>
  )
}
