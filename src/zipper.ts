import JSZip from 'jszip'
import type { DownloadedImage } from './background/index'

export interface ZipOptions {
  title: string
  markdown: string
  images: DownloadedImage[]
  imageMap: Map<string, string> // originalUrl → local path
}

// chrome.downloads.download() rejects filenames with control chars, trailing dots/spaces, or empty strings
function sanitizeDownloadName(name: string): string {
  return (
    name
      .replace(/[\x00-\x1f\x7f]/g, '')   // strip control characters
      .replace(/[/\\:*?"<>|]/g, '-')      // strip Windows-invalid chars (belt-and-suspenders)
      .replace(/\.+$/, '')                // strip trailing dots (Windows rejects them)
      .trim()
    || 'article'
  )
}

// Task 5.1 + 5.2 + 5.3
export async function buildAndDownloadZip(opts: ZipOptions): Promise<void> {
  const { title, markdown, images, imageMap } = opts
  const zip = new JSZip()
  const folder = zip.folder(title)!

  // Task 5.1: add markdown
  folder.file('article.md', markdown)

  // Task 5.2: only create images/ if there are successfully downloaded images
  const successfulImages = images.filter((img) => !img.degraded && img.data !== null)

  if (successfulImages.length > 0) {
    const imagesFolder = folder.folder('images')!
    for (const img of successfulImages) {
      // Derive filename from imageMap
      const localPath = imageMap.get(img.originalUrl)
      if (!localPath) continue
      const filename = localPath.replace('images/', '')
      imagesFolder.file(filename, new Uint8Array(img.data!))
    }
  }

  // Task 5.3: generate blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)

  const safeTitle = sanitizeDownloadName(title)
  try {
    await chrome.downloads.download({ url, filename: `${safeTitle}.zip`, saveAs: false })
  } catch {
    // Fallback: title may still contain chars Chrome rejects; use a timestamp name
    await chrome.downloads.download({ url, filename: `article_${Date.now()}.zip`, saveAs: false })
  }

  // Revoke after a brief delay to allow download to start
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
