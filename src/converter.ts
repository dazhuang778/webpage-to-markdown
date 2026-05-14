import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import type { ImageInfo } from './content/index'

// Task 3.1: Turndown instance with GFM plugin
function createTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
  })
  td.use(gfm)
  return td
}

export interface ConvertOptions {
  html: string
  title: string
  pageUrl: string
  images: ImageInfo[]
  mode: 'copy' | 'zip'
}

export interface ConvertResult {
  markdown: string
  imageMap: Map<string, string> // original URL → local path (zip mode only)
}

// Task 3.2 + 3.4 + 3.5: convert HTML to Markdown
// In 'copy' mode: preserve original image URLs
// In 'zip' mode: replace image URLs with local images/img_XXX.ext paths
export function convertToMarkdown(opts: ConvertOptions): ConvertResult {
  const { html, title, pageUrl, images, mode } = opts
  const td = createTurndown()

  // Build a URL→localPath map for zip mode
  const imageMap = new Map<string, string>()

  if (mode === 'zip') {
    images.forEach((img) => {
      const ext = guessExtFromUrl(img.url) || 'jpg'
      const localPath = `images/img_${String(img.index + 1).padStart(3, '0')}.${ext}`
      imageMap.set(img.url, localPath)
    })

    // Rewrite img src in HTML before conversion
    td.addRule('img-local', {
      filter: 'img',
      replacement(_content, node) {
        const el = node as HTMLImageElement
        const src = el.getAttribute('src') || ''
        const alt = el.getAttribute('alt') || ''
        const localPath = imageMap.get(src)
        if (localPath) return `![${alt}](${localPath})`
        // CORS degraded: keep original URL
        return `![${alt}](${src})`
      },
    })
  }

  const body = convertHtml(html, td)

  // Task 3.3: inject header
  const header = `# ${title}\n\n> 来源：${pageUrl}\n\n`
  const markdown = header + body

  return { markdown, imageMap }
}

function convertHtml(html: string, td: TurndownService): string {
  // Wrap in a div so turndown can parse it
  const wrapper = `<div>${html}</div>`
  return td.turndown(wrapper)
}

export function guessExtFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.(\w{2,5})$/i)
    if (match) {
      const ext = match[1].toLowerCase()
      // Only accept known image extensions
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext
      }
    }
  } catch {
    // ignore
  }
  return ''
}

export function guessExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
  }
  return map[mime.split(';')[0].trim()] || 'jpg'
}
