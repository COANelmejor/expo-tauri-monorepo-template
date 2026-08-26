#!/usr/bin/env node
import {
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SELF = join(ROOT, 'scripts', 'init-template.mjs')

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'target', '.expo', '.turbo', 'gen'])
const TEXT_EXTENSIONS = new Set(['.json', '.ts', '.tsx', '.js', '.mjs', '.md', '.toml', '.yaml'])
const SKIP_FILES = new Set(['pnpm-lock.yaml'])

const PLACEHOLDERS = {
  prefix: '@app/',
  slug: 'app-template',
  identifier: 'com.example.app',
  displayName: 'App Template',
  scheme: 'apptemplate',
}

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || SKIP_FILES.has(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      found.push(...walk(path))
      continue
    }
    const dot = entry.lastIndexOf('.')
    if (dot > 0 && TEXT_EXTENSIONS.has(entry.slice(dot))) found.push(path)
  }
  return found
}

function alreadyInitialised() {
  return !walk(ROOT).some((file) => readFileSync(file, 'utf8').includes(PLACEHOLDERS.prefix))
}

function applyReplacements(answers) {
  const pairs = [
    [PLACEHOLDERS.prefix, `@${answers.prefix}/`],
    [PLACEHOLDERS.displayName, answers.displayName],
    [PLACEHOLDERS.slug, answers.slug],
    [PLACEHOLDERS.identifier, answers.identifier],
    [PLACEHOLDERS.scheme, answers.scheme],
  ]
  let touched = 0
  for (const file of walk(ROOT)) {
    const before = readFileSync(file, 'utf8')
    let after = before
    for (const [from, to] of pairs) after = after.split(from).join(to)
    if (after !== before) {
      writeFileSync(file, after)
      touched += 1
    }
  }
  return touched
}

function rewriteLicense({ author, year }) {
  const path = join(ROOT, 'LICENSE')
  const text = readFileSync(path, 'utf8')
  writeFileSync(path, text.replace(/^Copyright \(c\) .*$/m, `Copyright (c) ${year} ${author}`))
}

// Drops a "## Heading" section and everything up to the next heading of the same level.
function dropSection(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`)
  if (start === -1) return markdown
  const next = markdown.indexOf('\n## ', start + 1)
  return next === -1
    ? markdown.slice(0, start).trimEnd() + '\n'
    : markdown.slice(0, start) + markdown.slice(next + 1)
}

function resolveReadme(language, { displayName, description }) {
  const english = join(ROOT, 'README.md')
  const spanish = join(ROOT, 'README.es.md')
  const keeping = language === 'es' ? spanish : english
  rmSync(language === 'es' ? english : spanish)
  if (language === 'es') renameSync(spanish, english)

  let text = readFileSync(english, 'utf8')
  text = text.replace(/^\*\*English\*\* · \[Español\]\(README\.es\.md\)\n\n/m, '')
  text = text.replace(/^\[English\]\(README\.md\) · \*\*Español\*\*\n\n/m, '')
  text = dropSection(text, 'What to replace after cloning')
  text = dropSection(text, 'Qué reemplazar al clonar')
  text = dropSection(text, 'Idioma del repositorio')
  // The surviving README still introduces itself as the template; make it the project's.
  text = text.replace(/^# .*\n\n[\s\S]*?\n\n(?=##)/, `# ${displayName}\n\n${description}\n\n`)
  writeFileSync(english, text)
  return relative(ROOT, keeping)
}

function rewriteClaudeIntro({ displayName, description }) {
  const path = join(ROOT, 'CLAUDE.md')
  const text = readFileSync(path, 'utf8')
  const intro = `# CLAUDE.md

## What this repository is

${displayName} — ${description}

It runs on Android, iOS, web and desktop from a single codebase, and is built
to be worked on with a coding agent. This file is the contract: read it before
changing anything.

`
  const next = text.indexOf('\n## ', text.indexOf('## What this repository is') + 1)
  writeFileSync(path, intro + text.slice(next + 1))
}

function removeSelf() {
  const path = join(ROOT, 'package.json')
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  delete manifest.scripts['init:project']
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)
  rmSync(SELF)
  try {
    rmdirSync(join(ROOT, 'scripts'))
  } catch {
    // scripts/ still holds other files; leaving it in place is correct.
  }
}

const VALIDATORS = {
  slug: [/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lowercase letters, digits and single hyphens'],
  prefix: [/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits and hyphens, no leading @ or /'],
  identifier: [/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/, 'reverse domain, e.g. com.acme.myapp'],
  scheme: [/^[a-z][a-z0-9]*$/, 'lowercase letters and digits, no hyphens'],
}

// readline consumes a piped stream in one go, leaving later questions unanswered
// and the process exiting silently. Buffer non-TTY input and serve it line by line.
async function createPrompter() {
  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout })
    return { ask: (question) => rl.question(question), close: () => rl.close() }
  }
  let raw = ''
  for await (const chunk of stdin) raw += chunk
  const lines = raw.split('\n')
  let index = 0
  return {
    ask: async (question) => {
      stdout.write(question)
      if (index >= lines.length) throw new Error(`ran out of piped answers at: ${question.trim()}`)
      const answer = lines[index++]
      stdout.write(`${answer}\n`)
      return answer
    },
    close: () => {},
  }
}

async function main() {
  if (alreadyInitialised()) {
    console.log('This project has already been initialised — no template placeholders left.')
    process.exit(0)
  }

  const prompt = await createPrompter()
  const ask = async (question, fallback, key) => {
    while (true) {
      const raw = (await prompt.ask(`${question}${fallback ? ` (${fallback})` : ''}: `)).trim()
      const value = raw || fallback || ''
      if (!key) return value
      const [pattern, hint] = VALIDATORS[key]
      if (pattern.test(value)) return value
      console.log(`  x ${hint}`)
    }
  }

  console.log('\nSet up this template as a new project. Press enter to accept a default.\n')

  const slug = await ask('Project name (kebab-case)', '', 'slug')
  const displayName = await ask(
    'Display name',
    slug.replace(/(^|-)([a-z])/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase()),
  )
  const prefix = await ask('Package prefix, without @', slug, 'prefix')
  const identifier = await ask(
    'Bundle identifier',
    `com.example.${slug.replace(/-/g, '')}`,
    'identifier',
  )
  const scheme = await ask('Deep link scheme', slug.replace(/-/g, ''), 'scheme')
  const description = await ask(
    'One-line description',
    `A cross-platform app called ${displayName}`,
  )
  const author = await ask('License holder', '')
  const year = await ask('License year', String(new Date().getFullYear()))
  const language = (await ask('README language: en or es', 'en')).toLowerCase().startsWith('es')
    ? 'es'
    : 'en'
  const dropDocs = (await ask('Delete docs/superpowers (original design notes)? y/n', 'y'))
    .toLowerCase()
    .startsWith('y')

  console.log(`
About to apply:
  packages          @app/…            ->  @${prefix}/…
  project name      app-template      ->  ${slug}
  display name      App Template      ->  ${displayName}
  identifier        com.example.app   ->  ${identifier}
  deep link scheme  apptemplate       ->  ${scheme}
  LICENSE           Copyright (c) ${year} ${author}
  README            keeping ${language === 'es' ? 'Spanish' : 'English'}, dropping the other
  CLAUDE.md         new introduction
  docs/superpowers  ${dropDocs ? 'delete' : 'keep'}
  this script       deletes itself
`)

  const go = (await prompt.ask('Apply these changes? y/n: ')).trim().toLowerCase()
  prompt.close()
  if (!go.startsWith('y')) {
    console.log('Nothing was changed.')
    process.exit(0)
  }

  const touched = applyReplacements({ prefix, slug, identifier, displayName, scheme })
  rewriteLicense({ author, year })
  const readme = resolveReadme(language, { displayName, description })
  rewriteClaudeIntro({ displayName, description })
  if (dropDocs) rmSync(join(ROOT, 'docs', 'superpowers'), { recursive: true, force: true })
  removeSelf()

  console.log(`
Done. ${touched} files updated, ${readme} kept as README.md.

Next:
  pnpm install
  pnpm dev:web
`)
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`)
  process.exit(1)
})
