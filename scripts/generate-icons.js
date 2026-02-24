const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'resources', 'icon.svg');
const outDir = path.join(__dirname, '..', 'resources');

const sizes = [16, 24, 32, 48, 64, 128, 256, 512];

async function generatePngs() {
  const svg = fs.readFileSync(svgPath);
  for (const size of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
  // Also generate the main icon.png (256px) that electron-builder uses for Linux
  await sharp(svg).resize(256, 256).png().toFile(path.join(outDir, 'icon.png'));
  console.log('Generated icon.png (256px)');
}

// Build ICO file manually (ICO format: header + directory entries + image data)
async function generateIco() {
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const images = [];

  const svg = fs.readFileSync(svgPath);
  for (const size of icoSizes) {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    images.push({ size, data: png });
  }

  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: 1 = ICO
  header.writeUInt16LE(images.length, 4); // image count

  // Directory entries: 16 bytes each
  const dirEntries = [];
  let dataOffset = 6 + images.length * 16;

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);  // width (0 = 256)
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);  // height
    entry.writeUInt8(0, 2);                                 // color palette
    entry.writeUInt8(0, 3);                                 // reserved
    entry.writeUInt16LE(1, 4);                              // color planes
    entry.writeUInt16LE(32, 6);                             // bits per pixel
    entry.writeUInt32LE(img.data.length, 8);                // data size
    entry.writeUInt32LE(dataOffset, 12);                    // data offset
    dirEntries.push(entry);
    dataOffset += img.data.length;
  }

  const ico = Buffer.concat([header, ...dirEntries, ...images.map(i => i.data)]);
  fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);
  console.log('Generated icon.ico');
}

async function main() {
  await generatePngs();
  await generateIco();
  console.log('Done!');
}

main().catch(console.error);
