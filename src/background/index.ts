import { guessExtFromUrl, guessExtFromMime } from '../converter'

export interface ImageDownloadRequest {
  type: 'DOWNLOAD_IMAGES'
  images: Array<{ url: string; index: number }>
  popupTabId?: number
}

export interface DownloadedImage {
  index: number
  data: number[] | null  // ArrayBuffer as number array (serializable), null = degraded
  ext: string
  originalUrl: string
  degraded: boolean
}

// Task 4.1: fetch one image, returning ArrayBuffer + extension
async function fetchImage(url: string): Promise<{ data: ArrayBuffer; ext: string }> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const contentType = response.headers.get('content-type') || ''
  const ext = guessExtFromUrl(url) || guessExtFromMime(contentType) || 'jpg'
  const data = await response.arrayBuffer()
  return { data, ext }
}

// Task 4.2 + 4.3 + 4.4: concurrent download with pool, degradation, progress
async function downloadImages(
  images: Array<{ url: string; index: number }>,
  sendProgress: (done: number, total: number) => void
): Promise<DownloadedImage[]> {
  const total = images.length
  let done = 0
  const results: DownloadedImage[] = new Array(total)

  // Promise pool: max 5 concurrent
  const CONCURRENCY = 5
  const queue = [...images]

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!
      try {
        const { data, ext } = await fetchImage(item.url)
        results[item.index] = {
          index: item.index,
          data: Array.from(new Uint8Array(data)),
          ext,
          originalUrl: item.url,
          degraded: false,
        }
      } catch {
        // Task 4.3: degrade on failure
        results[item.index] = {
          index: item.index,
          data: null,
          ext: 'jpg',
          originalUrl: item.url,
          degraded: true,
        }
      }
      done++
      sendProgress(done, total)
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total) }, worker)
  await Promise.all(workers)

  return results
}

// Task 4.4 + 4.5: message routing
chrome.runtime.onMessage.addListener((message: ImageDownloadRequest, _sender, sendResponse) => {
  if (message.type !== 'DOWNLOAD_IMAGES') return false

  const { images } = message

  if (!images || images.length === 0) {
    sendResponse({ ok: true, results: [] })
    return true
  }

  // Task 4.4: send progress updates back to popup via chrome.runtime.sendMessage
  function sendProgress(done: number, total: number) {
    chrome.runtime.sendMessage({ type: 'PROGRESS', done, total }).catch(() => {
      // Popup may have closed; ignore
    })
  }

  downloadImages(images, sendProgress)
    .then((results) => {
      sendResponse({ ok: true, results })
    })
    .catch((err) => {
      sendResponse({ ok: false, error: String(err) })
    })

  return true // keep channel open for async
})
