import { Readability } from '@mozilla/readability'

export interface ImageInfo {
  url: string
  index: number
}

export interface ExtractResult {
  html: string
  title: string
  pageUrl: string
  images: ImageInfo[]
}

// Task 2.4: clean page title for use as filename
function cleanTitle(raw: string): string {
  return raw
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

// Task 2.1: resolve the real image URL from lazy-load attributes
function resolveImageUrl(img: HTMLImageElement): string | null {
  const candidates = [
    img.getAttribute('data-src'),
    img.getAttribute('data-original'),
    img.getAttribute('data-lazy-src'),
  ]

  for (const candidate of candidates) {
    if (candidate && !isPlaceholder(candidate)) {
      return toAbsolute(candidate)
    }
  }

  // srcset: take the first URL
  const srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset')
  if (srcset) {
    const first = srcset.split(',')[0].trim().split(/\s+/)[0]
    if (first && !isPlaceholder(first)) return toAbsolute(first)
  }

  const src = img.getAttribute('src')
  if (src && !isPlaceholder(src)) return toAbsolute(src)

  return null
}

function isPlaceholder(url: string): boolean {
  if (url.startsWith('data:')) return true
  // 1px GIF/PNG placeholders
  if (/1x1|placeholder|blank\.(gif|png|jpg)/i.test(url)) return true
  return false
}

function toAbsolute(url: string): string {
  try {
    return new URL(url, location.href).href
  } catch {
    return url
  }
}

// Collect all images from a given root element and rewrite src to resolved URL in-place
function collectImages(root: Element): ImageInfo[] {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'))
  const seen = new Set<string>()
  const result: ImageInfo[] = []

  for (const img of imgs) {
    const url = resolveImageUrl(img)
    if (url && !seen.has(url)) {
      seen.add(url)
      img.src = url // rewrite in-place so HTML output has the real URL
      result.push({ url, index: result.length })
    } else if (!url) {
      img.remove() // remove unresolvable images
    }
  }

  return result
}

// Task 2.2: smart extraction using Readability; falls back to full-page
function extractSmart(): { html: string; images: ImageInfo[] } {
  const docClone = document.cloneNode(true) as Document
  const reader = new Readability(docClone)
  const article = reader.parse()

  if (article?.content) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = article.content
    const images = collectImages(wrapper) // rewrites src in-place
    return { html: wrapper.innerHTML, images }
  }

  // Fallback to full page
  return extractFull()
}

// Task 2.3: full page extraction
function extractFull(): { html: string; images: ImageInfo[] } {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = document.body.innerHTML
  const images = collectImages(wrapper) // rewrites src in-place
  return { html: wrapper.innerHTML, images }
}

// Task 2.5: message listener
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'EXTRACT') return false

  try {
    const mode: 'smart' | 'full' = message.mode ?? 'smart'
    const { html, images } = mode === 'smart' ? extractSmart() : extractFull()

    const title = cleanTitle(document.title || 'Untitled')
    const pageUrl = location.href

    const result: ExtractResult = { html, title, pageUrl, images }
    sendResponse({ ok: true, data: result })
  } catch (err) {
    sendResponse({ ok: false, error: String(err) })
  }

  return true // keep channel open for async
})
