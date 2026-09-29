import QRCode from "qrcode"
// Type-only so jsPDF is erased at build time; the runtime module is imported
// lazily inside buildSerialStickerPdf to keep it out of the page bundle.
import type { jsPDF as JsPdfInstance } from "jspdf"

/** A4 in millimetres. */
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const PAGE_MARGIN = 6

/** 3 x 5 = 15 stickers per A4 sheet, roughly 66mm x 57mm each. */
const STICKER_COLUMNS = 3
const STICKER_ROWS = 5

const BRAND_LABEL = "RepairOnGo"

export interface StickerPdfOptions {
  /** Called after each sticker is drawn so the UI can show real progress. */
  onProgress?: (done: number, total: number) => void
  /** Shown in the sheet footer, e.g. the batch id. */
  batchLabel?: string
}

export async function buildSerialStickerPdf(
  serials: string[],
  options: StickerPdfOptions = {}
): Promise<Blob> {
  const { onProgress, batchLabel } = options

  if (!Array.isArray(serials) || serials.length === 0) {
    throw new Error("There are no serials to print.")
  }

  const { jsPDF } = await import("jspdf")
  const doc: JsPdfInstance = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  const total = serials.length
  const cellWidth = (PAGE_WIDTH - PAGE_MARGIN * 2) / STICKER_COLUMNS
  const cellHeight = (PAGE_HEIGHT - PAGE_MARGIN * 2) / STICKER_ROWS
  const qrSize = Math.min(cellWidth, cellHeight) * 0.6

  // QR encoding is CPU bound, so yield to the event loop periodically to keep the
  // progress indicator painting instead of freezing the tab on large batches.
  let processed = 0
  const YIELD_EVERY = 10
  const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

  for (let index = 0; index < total; index++) {
    const column = index % STICKER_COLUMNS
    const row = Math.floor(index / STICKER_COLUMNS) % STICKER_ROWS
    const isFirstOnPage = index % (STICKER_COLUMNS * STICKER_ROWS) === 0

    if (isFirstOnPage) {
      if (index > 0) doc.addPage()
      if (batchLabel) {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Batch ${batchLabel}`, PAGE_MARGIN, PAGE_MARGIN - 1.5)
        doc.setTextColor(0)
      }
    }

    const cellX = PAGE_MARGIN + column * cellWidth
    const cellY = PAGE_MARGIN + row * cellHeight

    // Dashed cut line
    doc.setLineWidth(0.2)
    doc.setDrawColor(170)
    doc.setLineDashPattern([1, 1], 0)
    doc.rect(cellX + 1, cellY + 1, cellWidth - 2, cellHeight - 2)
    doc.setLineDashPattern([], 0)
    doc.setDrawColor(0)

    const serial = serials[index]
    const dataUrl = await QRCode.toDataURL(serial, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M",
    })

    const qrX = cellX + (cellWidth - qrSize) / 2
    const qrY = cellY + (cellHeight - qrSize) / 2 - 5
    doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(serial, cellX + cellWidth / 2, qrY + qrSize + 5, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(140)
    doc.text(BRAND_LABEL, cellX + cellWidth / 2, qrY + qrSize + 8.5, { align: "center" })
    doc.setTextColor(0)

    processed += 1
    onProgress?.(processed, total)
    if (processed % YIELD_EVERY === 0) await yieldToUi()
  }

  return doc.output("blob")
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
