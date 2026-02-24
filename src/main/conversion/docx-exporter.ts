import { prosemirrorToDocx } from './prosemirror-to-docx'

export async function exportDocx(editorJson: unknown): Promise<Buffer> {
  return prosemirrorToDocx(editorJson as Parameters<typeof prosemirrorToDocx>[0])
}
