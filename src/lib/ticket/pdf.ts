// Just enough PDF to lay JPEG pictures out on pages and draw thin lines (crop marks).
// Each picture is stored once and can be placed as many times as needed.
// Positions are in points (1/72 inch) from the top left of the page.

export type PdfImage = { jpeg: Uint8Array; width: number; height: number };
export type PdfPlacement = { image: number; x: number; y: number; w: number; h: number };
export type PdfPage = {
  placements: PdfPlacement[];
  // Straight lines as [x1, y1, x2, y2]
  lines: [number, number, number, number][];
};

const num = (value: number) => String(+value.toFixed(3));

export function buildPdf(pageW: number, pageH: number, images: PdfImage[], pages: PdfPage[]): Blob {
  const text = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let position = 0;

  const write = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? text.encode(data) : data;
    chunks.push(bytes);
    position += bytes.length;
  };
  // Starts object number `id`, which is remembered for the cross-reference table at the end
  const begin = (id: number) => {
    offsets[id] = position;
    write(`${id} 0 obj\n`);
  };

  // 1 is the catalog and 2 the page list. Then the pictures, then a content stream and a page for each page.
  const imageId = (i: number) => 3 + i;
  const contentId = (p: number) => 3 + images.length + p * 2;
  const pageId = (p: number) => contentId(p) + 1;
  const total = 2 + images.length + pages.length * 2;

  write("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");

  begin(1);
  write("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  begin(2);
  write(
    `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, p) => `${pageId(p)} 0 R`).join(" ")}] >>\nendobj\n`,
  );

  images.forEach((image, i) => {
    begin(imageId(i));
    write(
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`,
    );
    write(image.jpeg);
    write("\nendstream\nendobj\n");
  });

  const resources = `<< /XObject << ${images.map((_, i) => `/Im${i} ${imageId(i)} 0 R`).join(" ")} >> >>`;
  pages.forEach((page, p) => {
    let content = "0.3 w 0 G\n";
    for (const [x1, y1, x2, y2] of page.lines) {
      content += `${num(x1)} ${num(pageH - y1)} m ${num(x2)} ${num(pageH - y2)} l S\n`;
    }
    for (const { image, x, y, w, h } of page.placements) {
      content += `q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(pageH - y - h)} cm /Im${image} Do Q\n`;
    }
    const length = text.encode(content).length;

    begin(contentId(p));
    write(`<< /Length ${length} >>\nstream\n${content}endstream\nendobj\n`);
    begin(pageId(p));
    write(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pageW)} ${num(pageH)}] ` +
        `/Resources ${resources} /Contents ${contentId(p)} 0 R >>\nendobj\n`,
    );
  });

  const xref = position;
  write(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= total; id++) write(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  write(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}
