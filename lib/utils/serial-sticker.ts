import JsBarcode from "jsbarcode"
// Type-only so jsPDF is erased at build time; the runtime module is imported
// lazily inside buildSerialStickerPdf to keep it out of the page bundle.
import type { jsPDF as JsPdfInstance } from "jspdf"
import { toCompactSerialPayload } from "@/data/serial-numbers"

/** A4 in millimetres. The top margin doubles as room for the batch label. */
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const PAGE_MARGIN = 12

/**
 * Sticker geometry, in millimetres.
 *
 * 42mm is a physical floor for a full serial, not a design choice. CODE128 spends
 * 11 modules per character, so "ROG-2026-000123" encodes to 178 modules, and
 * laser scanners need ~0.19mm per module — the bars alone need ~34mm before any
 * padding. 39mm of bars gives ~0.22mm per module, which clears that floor.
 *
 * The compact payload "2026000123" is only 90 modules and would fit a 22mm
 * sticker, but it carries no brand prefix, so it is printed as the human-readable
 * line instead of being the thing the scanner returns.
 */
const STICKER_WIDTH_MM = 42
const STICKER_PADDING_MM = 1.5
const STICKER_GUTTER_MM = 4

/** Gap between the bottom of the bars and the baseline of the printed serial. */
const SERIAL_TEXT_GAP = 4.5

const SERIAL_FONT_SIZE = 9

/**
 * Bar geometry in pixels.
 *
 * At 2.4px per module a full 15-character serial renders 427px wide, which
 * printed across the 39mm of usable sticker width gives ~278 DPI and ~0.22mm per
 * module. Dropping the module width below ~2.1px pushes the printed module width
 * under the scanner's 0.19mm limit and reads start failing silently.
 */
const BARCODE_MODULE_WIDTH = 2.4
const BARCODE_BAR_HEIGHT = 78

/**
 * ============================================================ REMOVE BEFORE SHIPPING
 * TEMPORARY scanner test mode.
 *
 * Set to a short readable string and every sticker encodes that value instead of
 * a serial, so you can confirm the scanner reads by checking the output against
 * text you already know. The printed line shows the same value, so a sheet built
 * with this on can never be mistaken for a real batch.
 *
 * Set back to `null` to go back to encoding serials.
 */
const TEST_BARCODE_PAYLOAD: string | null = null
// ============================================================ REMOVE BEFORE SHIPPING

/**
 * What the bars encode: the full serial, so any scanner hands back something
 * self-describing and nothing has to be reconstructed before it can be searched.
 */
function barcodePayloadFor(serial: string): string {
  return TEST_BARCODE_PAYLOAD ?? serial
}

/**
 * What is printed under the bars.
 *
 * The compact form fits the sticker at a readable size, and `toSerialIdPrefixes`
 * already resolves it back to the full serial when it is typed into search, so a
 * human reading the sticker has something short to key in by hand.
 */
function stickerLabelFor(serial: string): string {
  return TEST_BARCODE_PAYLOAD ?? toCompactSerialPayload(serial) ?? serial
}

export interface StickerPdfOptions {
  /** Called after each sticker is drawn so the UI can show real progress. */
  onProgress?: (done: number, total: number) => void
  /** Shown in the sheet header, e.g. the batch id. */
  batchLabel?: string
}

/**
 * Renders a CODE128 symbol on an offscreen canvas.
 *
 * CODE128 covers the full ASCII range, so both a compact payload of digits and a
 * readable test word need no escaping. jsBarcode sizes the canvas to the encoded
 * value, so the aspect ratio is read back rather than assumed.
 */
function renderBarcodeCanvas(serial: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  JsBarcode(canvas, barcodePayloadFor(serial), {
    format: "CODE128",
    width: BARCODE_MODULE_WIDTH,
    height: BARCODE_BAR_HEIGHT,
    // The serial is typeset by jsPDF below the bars as real vector text, so
    // jsBarcode must not draw its own copy.
    displayValue: false,
    margin: 0,
    background: "#ffffff",
    lineColor: "#000000",
  })
  return canvas
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

  const barcodeWidth = STICKER_WIDTH_MM - STICKER_PADDING_MM * 2

  // Render the first serial up front to learn the aspect ratio. Every serial has
  // the same shape (ROG-YYYY-NNNNNN), so one measurement sizes the whole grid.
  const probe = renderBarcodeCanvas(serials[0])
  const barcodeHeight = barcodeWidth * (probe.height / probe.width)
  const stickerHeight = barcodeHeight + SERIAL_TEXT_GAP + STICKER_PADDING_MM * 2

  const usableWidth = PAGE_WIDTH - PAGE_MARGIN * 2
  const usableHeight = PAGE_HEIGHT - PAGE_MARGIN * 2
  const columns = Math.max(
    1,
    Math.floor((usableWidth + STICKER_GUTTER_MM) / (STICKER_WIDTH_MM + STICKER_GUTTER_MM))
  )
  const rows = Math.max(
    1,
    Math.floor((usableHeight + STICKER_GUTTER_MM) / (stickerHeight + STICKER_GUTTER_MM))
  )
  const perPage = columns * rows

  // Barcode rendering is CPU bound, so yield to the event loop periodically to
  // keep the progress indicator painting instead of freezing the tab on large
  // batches.
  let processed = 0
  const YIELD_EVERY = 10
  const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

  for (let index = 0; index < total; index++) {
    const column = index % columns
    const row = Math.floor(index / columns) % rows
    const isFirstOnPage = index % perPage === 0

    if (isFirstOnPage) {
      if (index > 0) doc.addPage()
      if (batchLabel) {
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`Batch ${batchLabel}`, PAGE_MARGIN, PAGE_MARGIN - 5)
        doc.setTextColor(0)
      }
    }

    const stickerX = PAGE_MARGIN + column * (STICKER_WIDTH_MM + STICKER_GUTTER_MM)
    const stickerY = PAGE_MARGIN + row * (stickerHeight + STICKER_GUTTER_MM)

    // Dashed cut line around the sticker itself, not around the grid cell.
    doc.setLineWidth(0.2)
    doc.setDrawColor(170)
    doc.setLineDashPattern([1, 1], 0)
    doc.rect(stickerX, stickerY, STICKER_WIDTH_MM, stickerHeight)
    doc.setLineDashPattern([], 0)
    doc.setDrawColor(0)

    const serial = serials[index]
    const canvas = index === 0 ? probe : renderBarcodeCanvas(serial)

    doc.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      stickerX + STICKER_PADDING_MM,
      stickerY + STICKER_PADDING_MM,
      barcodeWidth,
      barcodeHeight
    )

    doc.setFont("helvetica", "bold")
    doc.setFontSize(SERIAL_FONT_SIZE)
    doc.setTextColor(0)
    doc.text(stickerLabelFor(serial), stickerX + STICKER_WIDTH_MM / 2, stickerY + STICKER_PADDING_MM + barcodeHeight + SERIAL_TEXT_GAP, {
      align: "center",
    })

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
