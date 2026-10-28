// Prints the value for VITE_PREVIEW_PASSWORD_SHA256 (the "coming soon" gate).
// Usage: npm run preview-hash -- "your-password"
import { createHash } from 'node:crypto'
import { SALT } from '../src/lib/previewSalt.js'

const password = process.argv[2]
if (!password) {
  console.error('Usage: npm run preview-hash -- "your-password"')
  process.exit(1)
}
console.log(createHash('sha256').update(SALT + password).digest('hex'))
