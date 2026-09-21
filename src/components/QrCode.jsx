import { useMemo } from "react";
import { buildQrMatrix } from "../lib/qr";

/** Renders the matrix as inline SVG — reused wherever a link needs an
 *  on-screen QR; buildStandaloneSvg (in ../lib/qr) covers the download. */
export default function QrCode({ value, className }) {
  const { size, cells } = useMemo(() => buildQrMatrix(value), [value]);
  const quiet = 2; // a real QR needs a quiet border to stay scannable

  return (
    <svg
      className={className}
      viewBox={`-${quiet} -${quiet} ${size + quiet * 2} ${size + quiet * 2}`}
      role="img"
      aria-label="QR code for this short link"
    >
      <rect x={-quiet} y={-quiet} width={size + quiet * 2} height={size + quiet * 2} fill="var(--pearl)" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--deep)" />
      ))}
    </svg>
  );
}
