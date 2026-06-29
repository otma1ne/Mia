// Converts a subset of HTML (Tiptap StarterKit output) to @react-pdf/renderer elements.
// Supported: h2, h3, p, ul, ol, li, blockquote, hr, strong, em, s, text nodes.

import React from 'react'
import { Text, View } from '@react-pdf/renderer'

// ─── Types ────────────────────────────────────────────────────

type PNode =
  | { kind: 'text'; text: string }
  | { kind: 'element'; tag: string; children: PNode[] }

// ─── HTML entity decoder ───────────────────────────────────────

function decode(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
}

// ─── Tokenizer / parser ────────────────────────────────────────

const VOID = new Set(['br', 'hr', 'img', 'input'])

function parse(html: string): PNode[] {
  const root: PNode[] = []
  const stack: (PNode & { kind: 'element' })[] = []

  const current = (): PNode[] =>
    stack.length ? stack[stack.length - 1].children : root

  // Matches: comment | open/close/self-close tag | text
  const re = /<!--[\s\S]*?-->|<(\/?)([A-Za-z][A-Za-z0-9]*)[^>]*(\/?)>|([^<]+)/g
  let m: RegExpExecArray | null

  while ((m = re.exec(html)) !== null) {
    if (m[4] !== undefined) {
      // text node
      const t = decode(m[4])
      if (t) current().push({ kind: 'text', text: t })
    } else if (!m[1] && !m[3]) {
      // opening tag
      const tag = m[2].toLowerCase()
      const node: PNode & { kind: 'element' } = { kind: 'element', tag, children: [] }
      current().push(node)
      if (!VOID.has(tag)) stack.push(node)
    } else if (m[1]) {
      // closing tag
      const tag = m[2].toLowerCase()
      const idx = stack.findLastIndex(n => n.tag === tag)
      if (idx !== -1) stack.splice(idx)
    }
    // self-closing (m[3]) handled by not pushing to stack above
  }

  return root
}

// ─── Inline renderer ───────────────────────────────────────────

interface InlineStyle {
  bold: boolean
  italic: boolean
  strike: boolean
}

const INLINE_TAGS = new Set(['strong', 'b', 'em', 'i', 's', 'del', 'span', 'a', 'code'])

function collectText(nodes: PNode[]): string {
  return nodes.map(n => n.kind === 'text' ? n.text : collectText(n.children)).join('')
}

function renderInline(
  nodes: PNode[],
  marks: InlineStyle,
  baseStyle: Record<string, unknown>,
  keyPrefix: string,
): React.ReactNode[] {
  return nodes.flatMap((node, i) => {
    const key = `${keyPrefix}-${i}`
    if (node.kind === 'text') {
      if (!node.text) return []
      const style: Record<string, unknown> = {
        ...baseStyle,
        fontFamily: marks.bold ? 'Helvetica-Bold' : 'Helvetica',
      }
      if (marks.italic)  style.fontStyle = 'italic'
      if (marks.strike)  style.textDecoration = 'line-through'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [<Text key={key} style={style as any}>{node.text}</Text>]
    }

    if (INLINE_TAGS.has(node.tag)) {
      const next: InlineStyle = {
        bold:   marks.bold   || node.tag === 'strong' || node.tag === 'b',
        italic: marks.italic || node.tag === 'em'     || node.tag === 'i',
        strike: marks.strike || node.tag === 's'      || node.tag === 'del',
      }
      return renderInline(node.children, next, baseStyle, key)
    }
    if (node.tag === 'br') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [<Text key={key} style={baseStyle as any}>{'\n'}</Text>]
    }
    // unknown inline tag — render children
    return renderInline(node.children, marks, baseStyle, key)
  })
}

// ─── Block renderer ────────────────────────────────────────────

interface BlockStyles {
  // Base text style applied to all paragraphs
  body:        Record<string, unknown>
  // Heading styles
  h2:          Record<string, unknown>
  h3:          Record<string, unknown>
  // List
  listItem:    Record<string, unknown>
  // Separator
  hr:          Record<string, unknown>
  // Blockquote wrapper
  blockquote:  Record<string, unknown>
}

const DEFAULT_STYLES: BlockStyles = {
  body:       { fontSize: 11, color: '#374151', lineHeight: 1.7 },
  h2:         { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 14, marginBottom: 4 },
  h3:         { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: '#374151', marginTop: 10, marginBottom: 3 },
  listItem:   { fontSize: 11, color: '#374151', lineHeight: 1.65, marginBottom: 2 },
  hr:         { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginTop: 8, marginBottom: 8 },
  blockquote: { paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: '#d1d5db', marginBottom: 6 },
}

function renderBlocks(
  nodes: PNode[],
  styles: BlockStyles,
  keyPrefix: string,
): React.ReactNode[] {
  const noMarks: InlineStyle = { bold: false, italic: false, strike: false }

  return nodes.flatMap((node, i) => {
    const key = `${keyPrefix}-${i}`

    if (node.kind === 'text') {
      const t = node.text.trim()
      if (!t) return []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [<Text key={key} style={styles.body as any}>{t}</Text>]
    }

    switch (node.tag) {
      case 'h1':
      case 'h2': {
        const inline = renderInline(node.children, noMarks, styles.h2, key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [<Text key={key} style={styles.h2 as any}>{inline}</Text>]
      }
      case 'h3': {
        const inline = renderInline(node.children, noMarks, styles.h3, key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [<Text key={key} style={styles.h3 as any}>{inline}</Text>]
      }
      case 'p': {
        const inline = renderInline(node.children, noMarks, styles.body, key)
        if (!inline.length) return []
        return [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Text key={key} style={{ ...styles.body, marginBottom: 4 } as any}>{inline}</Text>,
        ]
      }
      case 'ul':
      case 'ol': {
        return node.children
          .filter(c => c.kind === 'element' && c.tag === 'li')
          .flatMap((li, j) => {
            const bullet = node.tag === 'ul' ? '•  ' : `${j + 1}.  `
            const inline = renderInline(
              (li as PNode & { kind: 'element' }).children,
              noMarks,
              styles.listItem,
              `${key}-li-${j}`,
            )
            return [
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <View key={`${key}-li-${j}`} style={{ flexDirection: 'row', marginBottom: 2 } as any}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Text style={{ ...styles.listItem, width: 16 } as any}>{bullet}</Text>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Text style={{ ...styles.listItem, flex: 1 } as any}>{inline}</Text>
              </View>,
            ]
          })
      }
      case 'blockquote': {
        const inner = renderBlocks(node.children, styles, key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [<View key={key} style={styles.blockquote as any}>{inner}</View>]
      }
      case 'hr': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return [<View key={key} style={styles.hr as any} />]
      }
      default:
        // div, section, article, etc. — recurse
        return renderBlocks(node.children, styles, key)
    }
  })
}

// ─── Public API ────────────────────────────────────────────────

export function htmlToReactPdf(
  html: string,
  overrides: Partial<BlockStyles> = {},
): React.ReactNode {
  if (!html || html.trim() === '') return null

  const styles: BlockStyles = {
    ...DEFAULT_STYLES,
    ...overrides,
  }

  const nodes = parse(html)
  const blocks = renderBlocks(nodes, styles, 'root')

  return <View>{blocks}</View>
}
