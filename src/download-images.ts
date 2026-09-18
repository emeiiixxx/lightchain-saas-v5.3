type DownloadImage = { url: string; name: string };
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
// Store already-compressed images in one ZIP, avoiding multiple-download blocking.
export async function downloadImages(images: DownloadImage[], archiveName: string) {
  const files = await Promise.all(images.map(async image => {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error('Image download failed');
    return { name: new TextEncoder().encode(image.name), blob: await response.blob() };
  }));
  if (!files.length) return;
  if (files.length === 1) { save(files[0].blob, images[0].name); return; }
  const body: BlobPart[] = [], directory: BlobPart[] = [];
  let offset = 0, directorySize = 0;
  for (const file of files) {
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(bytes), local = new ArrayBuffer(30), central = new ArrayBuffer(46);
    const l = new DataView(local), c = new DataView(central);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true);
    l.setUint16(12, 33, true); l.setUint32(14, crc, true); l.setUint32(18, bytes.length, true); l.setUint32(22, bytes.length, true); l.setUint16(26, file.name.length, true);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true);
    c.setUint16(14, 33, true); c.setUint32(16, crc, true); c.setUint32(20, bytes.length, true); c.setUint32(24, bytes.length, true); c.setUint16(28, file.name.length, true); c.setUint32(42, offset, true);
    body.push(local, file.name, bytes); directory.push(central, file.name);
    offset += 30 + file.name.length + bytes.length; directorySize += 46 + file.name.length;
  }
  const end = new ArrayBuffer(22), view = new DataView(end);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, directorySize, true); view.setUint32(16, offset, true);
  save(new Blob([...body, ...directory, end], { type: 'application/zip' }), archiveName);
}
