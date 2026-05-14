import { convertToMarkdown } from '../converter'
import { buildAndDownloadZip } from '../zipper'
import type { ExtractResult } from '../content/index'
import type { DownloadedImage } from '../background/index'

// DOM refs
const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement
const progressArea = document.getElementById('progress-area') as HTMLDivElement
const progressBar = document.getElementById('progress-bar') as HTMLDivElement
const progressText = document.getElementById('progress-text') as HTMLSpanElement
const statusEl = document.getElementById('status') as HTMLDivElement
const modeInputs = document.querySelectorAll<HTMLInputElement>('input[name="mode"]')

// Task 6.2: load persisted mode
async function loadMode(): Promise<'smart' | 'full'> {
  const result = await chrome.storage.local.get('mode')
  return (result.mode as 'smart' | 'full') ?? 'smart'
}

async function saveMode(mode: string): Promise<void> {
  await chrome.storage.local.set({ mode })
}

async function init() {
  const saved = await loadMode()
  for (const input of modeInputs) {
    input.checked = input.value === saved
    input.addEventListener('change', () => saveMode(input.value))
  }
}

function getMode(): 'smart' | 'full' {
  for (const input of modeInputs) {
    if (input.checked) return input.value as 'smart' | 'full'
  }
  return 'smart'
}

// UI helpers
function setLoading(loading: boolean) {
  btnCopy.disabled = loading
  btnDownload.disabled = loading
}

function showStatus(msg: string, type: 'success' | 'error') {
  statusEl.textContent = msg
  statusEl.className = `status ${type}`
  statusEl.classList.remove('hidden')
}

function clearStatus() {
  statusEl.className = 'status hidden'
}

function showProgress(done: number, total: number) {
  progressArea.classList.remove('hidden')
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  progressBar.style.width = `${pct}%`
  progressText.textContent = `正在下载图片 ${done} / ${total}`
}

function hideProgress() {
  progressArea.classList.add('hidden')
  progressBar.style.width = '0%'
}

// Extract from content script
async function extractPage(mode: 'smart' | 'full'): Promise<ExtractResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('无法获取当前标签页')

  const send = () => chrome.tabs.sendMessage(tab.id!, { type: 'EXTRACT', mode })

  let response = await send().catch(() => null)

  if (!response) {
    // Content script not yet injected — inject manually then retry
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/index.mjs'] })
    await new Promise(r => setTimeout(r, 150))
    response = await send()
  }

  if (!response?.ok) throw new Error(response?.error ?? '页面提取失败')
  return response.data as ExtractResult
}

// Task 6.3: Copy MD flow
async function handleCopy() {
  setLoading(true)
  clearStatus()
  try {
    const mode = getMode()
    const extracted = await extractPage(mode)
    const { markdown } = convertToMarkdown({
      html: extracted.html,
      title: extracted.title,
      pageUrl: extracted.pageUrl,
      images: extracted.images,
      mode: 'copy',
    })
    await navigator.clipboard.writeText(markdown)
    btnCopy.textContent = '已复制！'
    showStatus('Markdown 已复制到剪贴板', 'success')
    setTimeout(() => {
      btnCopy.textContent = '复制 MD'
    }, 1500)
  } catch (err) {
    // Task 6.6: error handling
    showStatus(`错误：${String(err)}`, 'error')
  } finally {
    setLoading(false)
  }
}

// Task 6.4 + 6.5: Download ZIP flow
async function handleDownload() {
  setLoading(true)
  clearStatus()
  hideProgress()

  // Listen for progress from background worker
  const progressListener = (msg: { type: string; done: number; total: number }) => {
    if (msg.type === 'PROGRESS') {
      showProgress(msg.done, msg.total)
    }
  }
  chrome.runtime.onMessage.addListener(progressListener)

  try {
    const mode = getMode()
    const extracted = await extractPage(mode)

    // Convert with local image paths
    const { markdown, imageMap } = convertToMarkdown({
      html: extracted.html,
      title: extracted.title,
      pageUrl: extracted.pageUrl,
      images: extracted.images,
      mode: 'zip',
    })

    let downloadedImages: DownloadedImage[] = []

    if (extracted.images.length > 0) {
      showProgress(0, extracted.images.length)

      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_IMAGES',
        images: extracted.images,
      })

      if (!response?.ok) throw new Error(response?.error ?? '图片下载失败')
      downloadedImages = response.results as DownloadedImage[]
    }

    hideProgress()
    showStatus('正在打包 ZIP...', 'success')

    await buildAndDownloadZip({
      title: extracted.title,
      markdown,
      images: downloadedImages,
      imageMap,
    })

    showStatus('下载完成！', 'success')
  } catch (err) {
    hideProgress()
    // Task 6.6: error handling
    showStatus(`错误：${String(err)}`, 'error')
  } finally {
    chrome.runtime.onMessage.removeListener(progressListener)
    setLoading(false)
  }
}

btnCopy.addEventListener('click', handleCopy)
btnDownload.addEventListener('click', handleDownload)

init()
