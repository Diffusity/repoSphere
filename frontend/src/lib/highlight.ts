import hljs from 'highlight.js/lib/core'

// Register 32 languages
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import less from 'highlight.js/lib/languages/less'
import xml from 'highlight.js/lib/languages/xml' // includes HTML
import json from 'highlight.js/lib/languages/json'

import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'

import python from 'highlight.js/lib/languages/python'
import ruby from 'highlight.js/lib/languages/ruby'
import php from 'highlight.js/lib/languages/php'
import perl from 'highlight.js/lib/languages/perl'
import lua from 'highlight.js/lib/languages/lua'
import bash from 'highlight.js/lib/languages/bash'
import powershell from 'highlight.js/lib/languages/powershell'

import haskell from 'highlight.js/lib/languages/haskell'
import elixir from 'highlight.js/lib/languages/elixir'
import erlang from 'highlight.js/lib/languages/erlang'
import scala from 'highlight.js/lib/languages/scala'
import kotlin from 'highlight.js/lib/languages/kotlin'

import yaml from 'highlight.js/lib/languages/yaml'
import ini from 'highlight.js/lib/languages/ini' // includes TOML
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import makefile from 'highlight.js/lib/languages/makefile'
import graphql from 'highlight.js/lib/languages/graphql'
import protobuf from 'highlight.js/lib/languages/protobuf'

import swift from 'highlight.js/lib/languages/swift'
import csharp from 'highlight.js/lib/languages/csharp'
import dart from 'highlight.js/lib/languages/dart'

// Web
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('less', less)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('json', json)

// Systems
hljs.registerLanguage('c', c)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)

// Scripting
hljs.registerLanguage('python', python)
hljs.registerLanguage('ruby', ruby)
hljs.registerLanguage('php', php)
hljs.registerLanguage('perl', perl)
hljs.registerLanguage('lua', lua)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('powershell', powershell)

// Functional
hljs.registerLanguage('haskell', haskell)
hljs.registerLanguage('elixir', elixir)
hljs.registerLanguage('erlang', erlang)
hljs.registerLanguage('scala', scala)
hljs.registerLanguage('kotlin', kotlin)

// Config / Data
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('makefile', makefile)
hljs.registerLanguage('graphql', graphql)
hljs.registerLanguage('protobuf', protobuf)

// Other
hljs.registerLanguage('swift', swift)
hljs.registerLanguage('csharp', csharp)
hljs.registerLanguage('dart', dart)

// Map file extensions to highlight.js language identifiers
const EXTENSION_MAP: Record<string, string> = {
  // Web
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript', mts: 'typescript', cts: 'typescript',
  css: 'css', scss: 'scss', less: 'less',
  html: 'xml', htm: 'xml', xml: 'xml', svg: 'xml', xhtml: 'xml',
  json: 'json', jsonc: 'json',
  // Systems
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hxx: 'cpp', hh: 'cpp',
  rs: 'rust',
  go: 'go',
  java: 'java',
  // Scripting
  py: 'python', pyw: 'python', pyi: 'python',
  rb: 'ruby', gemspec: 'ruby',
  php: 'php',
  pl: 'perl', pm: 'perl',
  lua: 'lua',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  ps1: 'powershell', psm1: 'powershell',
  // Functional
  hs: 'haskell',
  ex: 'elixir', exs: 'elixir',
  erl: 'erlang',
  scala: 'scala',
  kt: 'kotlin', kts: 'kotlin',
  // Config / Data
  yml: 'yaml', yaml: 'yaml',
  toml: 'ini', ini: 'ini',
  sql: 'sql',
  md: 'markdown', mdx: 'markdown',
  dockerfile: 'dockerfile',
  makefile: 'makefile', mk: 'makefile',
  graphql: 'graphql', gql: 'graphql',
  proto: 'protobuf',
  // Other
  swift: 'swift',
  cs: 'csharp',
  dart: 'dart',
}

export function getLanguageFromPath(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (!ext || filePath.indexOf('.') === -1) return undefined
  // Special cases for files without extensions like Dockerfile, Makefile
  const fileName = filePath.split('/').pop()?.toLowerCase()
  if (fileName === 'dockerfile') return 'dockerfile'
  if (fileName === 'makefile') return 'makefile'
  
  return EXTENSION_MAP[ext]
}

/**
 * Highlight a complete code string and return HTML.
 */
export function highlightCode(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language }).value
    } catch {
      // Fallback to auto-detection / escapeHtml
    }
  }
  // Return escaped HTML if no language
  return escapeHtml(code)
}

/**
 * Highlight a single line or block of code and return as an array of line strings.
 * This is used where we render line-by-line.
 */
export function highlightLines(code: string, language?: string): string[] {
  const highlighted = highlightCode(code, language)
  return highlighted.split('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export { hljs }
