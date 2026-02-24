import { PDFDocument } from 'pdf-lib'

interface SignatureInput {
  page: number // 1-indexed
  x: number // percentage from left
  y: number // percentage from top
  width: number // percentage of page width
  dataUrl: string // data:image/png;base64,...
}

export async function bakePdfSignatures(
  pdfBase64: string,
  signatures: SignatureInput[]
): Promise<Buffer> {
  const pdfBytes = Buffer.from(pdfBase64, 'base64')
  const pdfDoc = await PDFDocument.load(pdfBytes)

  for (const sig of signatures) {
    const pageIndex = sig.page - 1
    if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue

    const page = pdfDoc.getPage(pageIndex)
    const { width: pageWidth, height: pageHeight } = page.getSize()

    // Extract image bytes from data URL
    const base64Data = sig.dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    const imgBytes = Buffer.from(base64Data, 'base64')

    // Embed image (detect PNG vs JPEG)
    let image
    if (sig.dataUrl.includes('image/png')) {
      image = await pdfDoc.embedPng(imgBytes)
    } else {
      image = await pdfDoc.embedJpg(imgBytes)
    }

    // Convert percentages to PDF coordinates
    // Note: PDF y=0 is bottom, but our y% is from top
    const sigWidthPx = (sig.width / 100) * pageWidth
    const aspectRatio = image.height / image.width
    const sigHeightPx = sigWidthPx * aspectRatio

    const xPos = (sig.x / 100) * pageWidth
    const yPos = pageHeight - (sig.y / 100) * pageHeight - sigHeightPx

    page.drawImage(image, {
      x: xPos,
      y: yPos,
      width: sigWidthPx,
      height: sigHeightPx
    })
  }

  const outputBytes = await pdfDoc.save()
  return Buffer.from(outputBytes)
}
