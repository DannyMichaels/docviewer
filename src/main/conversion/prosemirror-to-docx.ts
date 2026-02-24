import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  ExternalHyperlink,
  AlignmentType,
  LevelFormat,
  convertInchesToTwip
} from 'docx'

interface ProseMirrorNode {
  type: string
  content?: ProseMirrorNode[]
  text?: string
  marks?: ProseMirrorMark[]
  attrs?: Record<string, unknown>
}

interface ProseMirrorMark {
  type: string
  attrs?: Record<string, unknown>
}

const HEADING_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6
}

function marksToRunOptions(
  marks?: ProseMirrorMark[]
): Record<string, unknown> {
  const opts: Record<string, unknown> = {}
  if (!marks) return opts
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        opts.bold = true
        break
      case 'italic':
        opts.italics = true
        break
      case 'underline':
        opts.underline = { type: 'single' }
        break
      case 'strike':
        opts.strike = true
        break
      case 'code':
        opts.font = { name: 'Courier New' }
        break
      case 'textStyle':
        if (mark.attrs?.color) {
          opts.color = (mark.attrs.color as string).replace('#', '')
        }
        break
      case 'highlight':
        opts.highlight = mark.attrs?.color || 'yellow'
        break
    }
  }
  return opts
}

function parseBase64Image(src: string): { buffer: Buffer; extension: string } | null {
  const match = src.match(/^data:image\/(png|jpeg|jpg|gif|bmp|svg\+xml);base64,(.+)$/)
  if (!match) return null
  return {
    buffer: Buffer.from(match[2], 'base64'),
    extension: match[1].replace('+xml', '')
  }
}

function convertInlineNodes(
  nodes: ProseMirrorNode[]
): (TextRun | ImageRun | ExternalHyperlink)[] {
  const runs: (TextRun | ImageRun | ExternalHyperlink)[] = []

  for (const node of nodes) {
    if (node.type === 'text') {
      const text = node.text || ''
      const opts = marksToRunOptions(node.marks)

      // Check for link mark
      const linkMark = node.marks?.find((m) => m.type === 'link')
      if (linkMark && linkMark.attrs?.href) {
        runs.push(
          new ExternalHyperlink({
            children: [new TextRun({ text, ...opts, style: 'Hyperlink' })],
            link: linkMark.attrs.href as string
          })
        )
      } else {
        runs.push(new TextRun({ text, ...opts }))
      }
    } else if (node.type === 'image') {
      const src = node.attrs?.src as string
      if (src) {
        const imgData = parseBase64Image(src)
        if (imgData) {
          const width = (node.attrs?.width as number) || 400
          const height = (node.attrs?.height as number) || 300
          runs.push(
            new ImageRun({
              data: imgData.buffer,
              transformation: { width, height },
              type: imgData.extension === 'png' ? 'png' : 'jpg'
            })
          )
        }
      }
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ break: 1 }))
    }
  }

  return runs
}

function getAlignment(
  attrs?: Record<string, unknown>
): AlignmentType | undefined {
  const textAlign = attrs?.textAlign as string | undefined
  switch (textAlign) {
    case 'center':
      return AlignmentType.CENTER
    case 'right':
      return AlignmentType.RIGHT
    case 'justify':
      return AlignmentType.JUSTIFIED
    default:
      return undefined
  }
}

let listCounter = 0

function convertNode(
  node: ProseMirrorNode,
  listRef?: string,
  listLevel?: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []

  switch (node.type) {
    case 'paragraph': {
      const children = node.content ? convertInlineNodes(node.content) : [new TextRun('')]
      const alignment = getAlignment(node.attrs)
      const opts: Record<string, unknown> = { children }
      if (alignment) opts.alignment = alignment
      if (listRef !== undefined && listLevel !== undefined) {
        opts.numbering = { reference: listRef, level: listLevel }
      }
      elements.push(new Paragraph(opts as ConstructorParameters<typeof Paragraph>[0]))
      break
    }

    case 'heading': {
      const level = (node.attrs?.level as number) || 1
      const children = node.content ? convertInlineNodes(node.content) : [new TextRun('')]
      const alignment = getAlignment(node.attrs)
      const opts: Record<string, unknown> = {
        children,
        heading: HEADING_MAP[level] || HeadingLevel.HEADING_1
      }
      if (alignment) opts.alignment = alignment
      elements.push(new Paragraph(opts as ConstructorParameters<typeof Paragraph>[0]))
      break
    }

    case 'bulletList': {
      const ref = `bullet-${++listCounter}`
      if (node.content) {
        for (const listItem of node.content) {
          elements.push(...convertListItem(listItem, ref, listLevel ?? 0, false))
        }
      }
      break
    }

    case 'orderedList': {
      const ref = `ordered-${++listCounter}`
      if (node.content) {
        for (const listItem of node.content) {
          elements.push(...convertListItem(listItem, ref, listLevel ?? 0, true))
        }
      }
      break
    }

    case 'blockquote': {
      if (node.content) {
        for (const child of node.content) {
          const paragraphs = convertNode(child)
          for (const p of paragraphs) {
            if (p instanceof Paragraph) {
              elements.push(
                new Paragraph({
                  children: (p as unknown as { options: { children: unknown[] } }).options
                    ?.children as ConstructorParameters<typeof TextRun>[0][] || [],
                  indent: { left: convertInchesToTwip(0.5) },
                  border: {
                    left: { style: 'single' as unknown as undefined, size: 6, color: '999999' }
                  }
                } as ConstructorParameters<typeof Paragraph>[0])
              )
            } else {
              elements.push(p)
            }
          }
        }
      }
      break
    }

    case 'codeBlock': {
      const text = node.content?.map((c) => c.text || '').join('') || ''
      const lines = text.split('\n')
      for (const line of lines) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: { name: 'Courier New' }, size: 20 })],
            spacing: { line: 240 }
          })
        )
      }
      break
    }

    case 'horizontalRule': {
      elements.push(
        new Paragraph({
          children: [],
          border: { bottom: { style: 'single' as unknown as undefined, size: 6, color: '000000' } }
        } as ConstructorParameters<typeof Paragraph>[0])
      )
      break
    }

    case 'table': {
      if (node.content) {
        const rows = node.content.map((rowNode) => {
          const cells = (rowNode.content || []).map((cellNode) => {
            const cellContent = cellNode.content
              ? cellNode.content.flatMap((c) => convertNode(c))
              : [new Paragraph({ children: [new TextRun('')] })]
            return new TableCell({
              children: cellContent as Paragraph[],
              width: { size: 100 / (rowNode.content?.length || 1), type: WidthType.PERCENTAGE }
            })
          })
          return new TableRow({ children: cells })
        })
        elements.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        )
      }
      break
    }

    case 'doc': {
      if (node.content) {
        for (const child of node.content) {
          elements.push(...convertNode(child))
        }
      }
      break
    }

    default: {
      // Fallback: try to process children
      if (node.content) {
        for (const child of node.content) {
          elements.push(...convertNode(child))
        }
      }
      break
    }
  }

  return elements
}

function convertListItem(
  listItem: ProseMirrorNode,
  ref: string,
  level: number,
  _ordered: boolean
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []
  if (listItem.content) {
    for (const child of listItem.content) {
      if (child.type === 'paragraph') {
        elements.push(...convertNode(child, ref, level))
      } else if (child.type === 'bulletList' || child.type === 'orderedList') {
        // Nested list
        const nestedRef = `${ref}-nested-${++listCounter}`
        if (child.content) {
          for (const nestedItem of child.content) {
            elements.push(
              ...convertListItem(nestedItem, nestedRef, level + 1, child.type === 'orderedList')
            )
          }
        }
      } else {
        elements.push(...convertNode(child))
      }
    }
  }
  return elements
}

function collectNumberings(node: ProseMirrorNode): { reference: string; ordered: boolean }[] {
  const numberings: { reference: string; ordered: boolean }[] = []
  const seen = new Set<string>()

  function walk(n: ProseMirrorNode, currentRef?: string, ordered?: boolean): void {
    if (n.type === 'bulletList' || n.type === 'orderedList') {
      listCounter++
      const ref =
        n.type === 'bulletList' ? `bullet-${listCounter}` : `ordered-${listCounter}`
      if (!seen.has(ref)) {
        seen.add(ref)
        numberings.push({ reference: ref, ordered: n.type === 'orderedList' })
      }
      currentRef = ref
      ordered = n.type === 'orderedList'
    }
    if (n.content) {
      for (const child of n.content) {
        walk(child, currentRef, ordered)
      }
    }
  }

  walk(node)
  return numberings
}

export async function prosemirrorToDocx(json: ProseMirrorNode): Promise<Buffer> {
  // Reset counter
  listCounter = 0

  // First pass: collect numbering definitions
  const savedCounter = listCounter
  const numberings = collectNumberings(json)
  listCounter = savedCounter

  // Reset counter for the actual conversion
  listCounter = 0

  const children = json.content ? json.content.flatMap((child) => convertNode(child)) : []

  const numberingConfig = numberings.map((n) => ({
    reference: n.reference,
    levels: [
      {
        level: 0,
        format: n.ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
        text: n.ordered ? '%1.' : '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) } } }
      },
      {
        level: 1,
        format: n.ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
        text: n.ordered ? '%2.' : '\u25E6',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) } } }
      },
      {
        level: 2,
        format: n.ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
        text: n.ordered ? '%3.' : '\u25AA',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) } } }
      }
    ]
  }))

  const doc = new Document({
    numbering: { config: numberingConfig },
    sections: [{ children: children as Paragraph[] }]
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
