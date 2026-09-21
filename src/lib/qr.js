import qrcode from "qrcode-generator";

/**
 * A real, scannable QR code — type 0 lets the library pick the smallest
 * grid that fits the URL, 'M' error correction is the standard middle
 * ground (survives a crease or a smudge on a printed poster without
 * bloating the grid the way 'H' would for a plain link).
 */
export function buildQrMatrix(value) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();

  const size = qr.getModuleCount();
  const cells = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (qr.isDark(y, x)) cells.push([x, y]);
    }
  }
  return { size, cells };
}

/** A standalone SVG string (fixed hex colours, no CSS vars) — what actually
 *  gets saved to disk, since a downloaded file has no page around it to
 *  resolve var(--pearl) against. */
export function buildStandaloneSvg(value, pixels = 640) {
  const { size, cells } = buildQrMatrix(value);
  const quiet = 2;
  const view = size + quiet * 2;

  const rects = cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="#03201a"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${view} ${view}" width="${pixels}" height="${pixels}">
<rect width="${view}" height="${view}" fill="#f2eee5"/>
<g transform="translate(${quiet},${quiet})">${rects}</g>
</svg>`;
}
