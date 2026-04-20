/**
 * Copies an HTML table to the clipboard in a way that works across
 * Excel 2010, Excel 2016+, Word, and Google Docs.
 *
 * Strategy:
 *  1. Inject a real <table> into the DOM (off-screen).
 *  2. Select it with document.createRange() + execCommand('copy').
 *     → This writes CF_HTML to the system clipboard — the only format
 *       Excel 2010 can read for multi-cell paste.
 *  3. If execCommand fails (sandboxed iframes, Firefox extensions),
 *     fall back to navigator.clipboard.write() with both text/html and
 *     text/plain blobs (works in Excel 2016+ and modern apps).
 *  4. Last resort: plain-text writeText() (pastes into one cell in old Excel).
 *
 * Returns the number of rows copied (excluding the header row).
 */
export async function copyTableToClipboard(
  headers: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  // Build tab-separated plain text (header + rows)
  const tsv = [
    headers.join("\t"),
    ...rows.map((r) => headers.map((h) => String(r[h] ?? "")).join("\t")),
  ].join("\n")

  // Build HTML table
  const th = headers
    .map(
      (h) =>
        `<th style="border:1px solid #aaa;padding:6px 10px;background:#e8edf5;font-weight:bold;text-align:right;">${escape(h)}</th>`
    )
    .join("")

  const tbody = rows
    .map((r) => {
      const tds = headers
        .map(
          (h) =>
            `<td style="border:1px solid #ccc;padding:6px 10px;text-align:right;">${escape(String(r[h] ?? ""))}</td>`
        )
        .join("")
      return `<tr>${tds}</tr>`
    })
    .join("")

  const html = `<table dir="rtl" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">
<thead><tr>${th}</tr></thead>
<tbody>${tbody}</tbody>
</table>`

  // ── 1. execCommand (Excel 2010 compatible) ────────────────────────────────
  const success = copyViaDOM(html)
  if (success) return

  // ── 2. ClipboardItem API (Excel 2016+, modern browsers) ──────────────────
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([tsv],  { type: "text/plain" }),
        "text/html":  new Blob([html], { type: "text/html"  }),
      }),
    ])
    return
  } catch { /* fall through */ }

  // ── 3. Plain-text fallback ────────────────────────────────────────────────
  await navigator.clipboard.writeText(tsv)
}

/** Injects an off-screen table, selects it, and runs execCommand('copy'). */
function copyViaDOM(html: string): boolean {
  try {
    const wrap = document.createElement("div")
    wrap.style.cssText =
      "position:fixed;top:-99999px;left:-99999px;opacity:0;pointer-events:none;"
    wrap.innerHTML = html
    document.body.appendChild(wrap)

    const range = document.createRange()
    range.selectNode(wrap)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)

    const ok = document.execCommand("copy")

    sel?.removeAllRanges()
    document.body.removeChild(wrap)
    return ok
  } catch {
    return false
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
