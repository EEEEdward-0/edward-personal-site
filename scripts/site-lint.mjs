import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const ignoredDirs = new Set(['.git', 'archive', 'dist', 'node_modules', 'models'])
const jsFiles = []
const htmlFiles = []
const cssFiles = []

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name) || name === '.DS_Store') continue

    const file = join(dir, name)
    const stat = statSync(file)

    if (stat.isDirectory()) {
      walk(file)
      continue
    }

    const ext = extname(file)
    if (ext === '.js' || ext === '.mjs') jsFiles.push(file)
    if (ext === '.html') htmlFiles.push(file)
    if (ext === '.css') cssFiles.push(file)
  }
}

walk(root)

// 这是最小化 lint：先确保所有脚本能被 Node 解析，再检查旧模块引用是否残留。
for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
}

const joinedSource = [...htmlFiles, ...jsFiles, ...cssFiles]
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')

const stalePatterns = [
  `camera-${'emotion'}.html`,
  `scripts/camera-${'emotion'}.js`,
  `styles/camera-${'emotion'}.css`
]
const staleHit = stalePatterns.find((pattern) => joinedSource.includes(pattern))
if (staleHit) {
  throw new Error(`Found stale Camera Emotion reference: ${staleHit}`)
}

const requiredFiles = [
  'index.html',
  'lab.html',
  'runtime-probe.html',
  'immersive-lab.html',
  'edge-ops-console.html',
  'scripts/i18n.js',
  'scripts/lab-systems.js'
]

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing required file: ${file}`)
  }
}

console.log(`lint ok: ${jsFiles.length} scripts checked`)
