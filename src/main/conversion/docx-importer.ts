import mammoth from 'mammoth'

export interface ImportResult {
  html: string
  messages: string[]
}

export async function importDocx(buffer: Buffer): Promise<ImportResult> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh"
      ],
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read()
        const base64 = imageBuffer.toString('base64')
        const contentType = image.contentType || 'image/png'
        return { src: `data:${contentType};base64,${base64}` }
      })
    }
  )

  return {
    html: result.value,
    messages: result.messages.map((m) => m.message)
  }
}
