import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

// Copy manifest.json to dist root
mkdirSync(dist, { recursive: true })
copyFileSync(join(root, 'public', 'manifest.json'), join(dist, 'manifest.json'))

// Copy icons
const iconsDir = join(dist, 'icons')
mkdirSync(iconsDir, { recursive: true })
for (const file of readdirSync(join(root, 'public', 'icons'))) {
  copyFileSync(
    join(root, 'public', 'icons', file),
    join(iconsDir, file),
  )
}

// Update popup path references in manifest (popup is in dist/popup/)
console.log('Assets copied to dist/')
