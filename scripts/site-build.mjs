import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const ignoredDirs = new Set(['.git', 'archive', 'dist', 'node_modules', 'models'])
const ignoredFiles = new Set(['.DS_Store'])
const allowedExtensions = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.ico',
  '.pdf',
  '.txt'
])

const getExtension = (name) => {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index).toLowerCase() : ''
}

const copySiteFile = (file) => {
  const rel = relative(root, file)
  const target = join(dist, rel)
  mkdirSync(dirname(target), { recursive: true })
  copyFileSync(file, target)
}

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (ignoredDirs.has(name) || ignoredFiles.has(name)) continue

    const file = join(dir, name)
    const stat = statSync(file)

    if (stat.isDirectory()) {
      walk(file)
      continue
    }

    if (name === '_headers' || allowedExtensions.has(getExtension(name))) {
      copySiteFile(file)
    }
  }
}

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })
walk(root)

// 这是静态构建清单，方便部署前确认输出来源和时间。
writeFileSync(
  join(dist, 'build-manifest.json'),
  JSON.stringify(
    {
      name: 'edward-personal-site',
      builtAt: new Date().toISOString(),
      entrypoints: ['index.html', 'lab.html', 'runtime-probe.html', 'immersive-lab.html', 'edge-ops-console.html']
    },
    null,
    2
  )
)

console.log(`build ok: static site generated at ${dist}`)
