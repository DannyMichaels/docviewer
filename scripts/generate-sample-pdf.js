const { PDFDocument, StandardFonts, rgb } = require('pdf-lib')
const fs = require('fs')
const path = require('path')

async function main() {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792]) // US Letter
  const font = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)

  const black = rgb(0, 0, 0)
  const gray = rgb(0.4, 0.4, 0.4)
  const lineColor = rgb(0.7, 0.7, 0.7)

  let y = 720

  // Title
  page.drawText('NON-DISCLOSURE AGREEMENT', {
    x: 140, y, size: 20, font: fontBold, color: black
  })
  y -= 40

  // Intro paragraph
  const lines = [
    'This Non-Disclosure Agreement ("Agreement") is entered into as of',
    '_______________, 2026, by and between:',
    '',
    'Party A: _____________________________________ ("Disclosing Party")',
    'Party B: _____________________________________ ("Receiving Party")',
    '',
    'WHEREAS, the Disclosing Party possesses certain confidential and',
    'proprietary information; and WHEREAS, the Receiving Party desires',
    'to receive and the Disclosing Party desires to disclose certain',
    'confidential information for the purpose of evaluating a potential',
    'business relationship.',
    '',
    'NOW, THEREFORE, in consideration of the mutual promises and',
    'covenants contained herein, the parties agree as follows:',
    '',
    '1. DEFINITION OF CONFIDENTIAL INFORMATION',
    '"Confidential Information" means any and all non-public information,',
    'including but not limited to technical, business, financial, and',
    'other information disclosed by the Disclosing Party.',
    '',
    '2. OBLIGATIONS OF RECEIVING PARTY',
    'The Receiving Party agrees to hold all Confidential Information',
    'in strict confidence and not to disclose it to any third party',
    'without prior written consent of the Disclosing Party.',
    '',
    '3. TERM',
    'This Agreement shall remain in effect for a period of two (2)',
    'years from the date first written above.',
    '',
    '4. GOVERNING LAW',
    'This Agreement shall be governed by and construed in accordance',
    'with the laws of the State of California.',
  ]

  for (const line of lines) {
    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
      page.drawText(line, { x: 60, y, size: 11, font: fontBold, color: black })
    } else {
      page.drawText(line, { x: 60, y, size: 11, font, color: line === '' ? black : black })
    }
    y -= 16
  }

  y -= 20

  // Signature section
  page.drawText('IN WITNESS WHEREOF, the parties have executed this Agreement', {
    x: 60, y, size: 11, font, color: black
  })
  y -= 16
  page.drawText('as of the date first written above.', {
    x: 60, y, size: 11, font, color: black
  })
  y -= 40

  // Signature blocks
  // Left side - Party A
  page.drawText('DISCLOSING PARTY', { x: 60, y, size: 10, font: fontBold, color: black })
  y -= 50

  // Signature line
  page.drawLine({ start: { x: 60, y }, end: { x: 260, y }, thickness: 1, color: lineColor })
  y -= 14
  page.drawText('Signature', { x: 60, y, size: 9, font, color: gray })
  y -= 24

  page.drawLine({ start: { x: 60, y }, end: { x: 260, y }, thickness: 1, color: lineColor })
  y -= 14
  page.drawText('Printed Name', { x: 60, y, size: 9, font, color: gray })
  y -= 24

  page.drawLine({ start: { x: 60, y }, end: { x: 260, y }, thickness: 1, color: lineColor })
  y -= 14
  page.drawText('Date', { x: 60, y, size: 9, font, color: gray })

  // Right side - Party B (reset y)
  let y2 = y + 14 + 24 + 14 + 24 + 14 + 50 // go back up

  page.drawText('RECEIVING PARTY', { x: 340, y: y2, size: 10, font: fontBold, color: black })
  y2 -= 50

  page.drawLine({ start: { x: 340, y: y2 }, end: { x: 540, y: y2 }, thickness: 1, color: lineColor })
  y2 -= 14
  page.drawText('Signature', { x: 340, y: y2, size: 9, font, color: gray })
  y2 -= 24

  page.drawLine({ start: { x: 340, y: y2 }, end: { x: 540, y: y2 }, thickness: 1, color: lineColor })
  y2 -= 14
  page.drawText('Printed Name', { x: 340, y: y2, size: 9, font, color: gray })
  y2 -= 24

  page.drawLine({ start: { x: 340, y: y2 }, end: { x: 540, y: y2 }, thickness: 1, color: lineColor })
  y2 -= 14
  page.drawText('Date', { x: 340, y: y2, size: 9, font, color: gray })

  const pdfBytes = await doc.save()
  const outPath = path.join(__dirname, '..', 'resources', 'sample-nda.pdf')
  fs.writeFileSync(outPath, pdfBytes)
  console.log(`Generated: ${outPath}`)
}

main().catch(console.error)
