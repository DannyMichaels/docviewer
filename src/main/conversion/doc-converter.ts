import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile, mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join, basename } from 'path'

const execFileAsync = promisify(execFile)

async function findLibreOffice(): Promise<string | null> {
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
          'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
        ]
      : process.platform === 'darwin'
        ? ['/Applications/LibreOffice.app/Contents/MacOS/soffice']
        : ['/usr/bin/soffice', '/usr/local/bin/soffice']

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ['--version'])
      return candidate
    } catch {
      continue
    }
  }

  // Try PATH
  try {
    await execFileAsync('soffice', ['--version'])
    return 'soffice'
  } catch {
    return null
  }
}

export async function isLibreOfficeAvailable(): Promise<boolean> {
  return (await findLibreOffice()) !== null
}

export async function convertDocToDocx(docBuffer: Buffer, originalFileName: string): Promise<Buffer> {
  const soffice = await findLibreOffice()
  if (!soffice) {
    throw new Error(
      'LibreOffice is not installed. Please install LibreOffice to open .doc files.\n\nDownload: https://www.libreoffice.org/download/'
    )
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'docviewer-'))
  const inputPath = join(tempDir, originalFileName)
  const outputName = basename(originalFileName, '.doc') + '.docx'
  const outputPath = join(tempDir, outputName)

  try {
    const { writeFile } = await import('fs/promises')
    await writeFile(inputPath, docBuffer)

    await execFileAsync(soffice, [
      '--headless',
      '--convert-to',
      'docx',
      '--outdir',
      tempDir,
      inputPath
    ])

    const result = await readFile(outputPath)
    return result
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
