/** Triggers a real file save for a string of content — used for the QR SVG
 *  download, and small enough to reuse anywhere else a "Download" button
 *  needs to hand the browser a file it built in memory. */
export function downloadText(filename, content, mime = "image/svg+xml") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Revoked on the next tick, after the click has already handed the blob
  // off to the browser's own download machinery.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
