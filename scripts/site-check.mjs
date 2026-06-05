import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (file) => readFileSync(join(root, file), 'utf8')

const assertIncludes = (source, needle, label) => {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
for (const scriptName of ['dev', 'test', 'lint', 'build']) {
  if (!packageJson.scripts?.[scriptName]) {
    throw new Error(`package.json missing script: ${scriptName}`)
  }
}

const labHtml = read('lab.html')
assertIncludes(labHtml, 'data-run-boundary', 'Edge Boundary runnable button')
assertIncludes(labHtml, 'data-run-system-layer', 'Systems Language Layer runnable button')
assertIncludes(labHtml, 'scripts/lab-systems.js', 'Lab systems script')
if (labHtml.includes('edge-runtime-strip')) {
  throw new Error('Lab runtime strip should be removed')
}

const immersiveCss = read('styles/immersive-lab.css')
assertIncludes(read('immersive-lab.html'), 'scene-menu-toggle', 'immersive foldable scene menu')
assertIncludes(immersiveCss, '.scene-control-panel[hidden]', 'immersive menu default hidden state')
assertIncludes(immersiveCss, 'border: 0 !important', 'borderless immersive controls')

const indexHtml = read('index.html')
if (indexHtml.includes('Read lab notes') || indexHtml.includes('阅读技术札记')) {
  throw new Error('Hero lab notes link should be removed')
}
if (indexHtml.includes('github-link') || indexHtml.includes('>查看项目<') || indexHtml.includes('>View project<')) {
  throw new Error('Visible project links should be removed from project cards')
}

const i18n = read('scripts/i18n.js')
assertIncludes(i18n, 'Run boundary check', 'English Edge Boundary text')
assertIncludes(i18n, 'Run concurrency demo', 'English Systems Language Layer text')
assertIncludes(i18n, 'ISS detail', 'English immersive controls')
assertIncludes(i18n, 'Systems & Databases', 'English skills section text')
assertIncludes(i18n, 'Internship Experience', 'English work section text')
assertIncludes(i18n, 'Local Network Anomaly Detection', 'English project title text')

// 这是功能回归测试：只验证静态站点必须具备的入口和交互钩子。
console.log('test ok: package scripts, Lab tools, immersive controls, and i18n hooks are present')
