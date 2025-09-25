import { readdirSync, statSync, readFileSync } from 'fs'
import path from 'path'
import { describe, it } from 'vitest'

// Recursively collect JSON files under the frontend directory, excluding heavy dirs
function collectJsonFiles(dir: string, files: string[] = []): string[] {
  const skip = new Set([
    'node_modules',
    'dist',
    'build',
    '.git',
    '.vite',
    'coverage',
    '.pytest_cache',
  ])

  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      collectJsonFiles(full, files)
    } else if (entry.toLowerCase().endsWith('.json')) {
      files.push(full)
    }
  }
  return files
}

describe('JSON files are UTF-8 without BOM', () => {
  it('should not contain a UTF-8 BOM (\uFEFF) prefix', () => {
    const root = process.cwd() // tests run from frontend cwd
    const jsonFiles = collectJsonFiles(root)
    const offenders: string[] = []
    for (const file of jsonFiles) {
      const buf = readFileSync(file)
      if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
      ) {
        offenders.push(path.relative(root, file))
      }
    }
    if (offenders.length) {
      throw new Error(
        `Found JSON files with UTF-8 BOM which breaks JSON.parse: \n` +
          offenders.join('\n')
      )
    }
  })
})
