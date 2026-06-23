// Shared barcode-scanning config used by every camera view in the app.
//
// Two deliberate choices here fix real-world misreads (e.g. scanning a curved
// can of beans returning a valid-but-wrong product):
//   1. Only retail product formats are enabled. Loose 1D symbologies like
//      CODE_39 / CODE_128 / ITF produce false positives on partial or curved
//      labels and never carry a grocery product's identity anyway.
//   2. TRY_HARDER lets ZXing rotate the frame, so a barcode reads whether it's
//      held horizontally or vertically as long as it's inside the viewfinder.
import { DecodeHintType, BarcodeFormat } from '@zxing/library'

// UPC-A / UPC-E / EAN-13 / EAN-8 cover essentially all packaged groceries.
const RETAIL_FORMATS = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
]

export const BARCODE_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, RETAIL_FORMATS],
  [DecodeHintType.TRY_HARDER, true],
])

// How many consecutive identical decodes we require before trusting a code.
// A single frame can misdecode; two in a row practically never agree on a
// wrong value.
export const REQUIRED_CONFIRMATIONS = 2

/**
 * Returns a function you feed each raw decode into. It returns `true` only once
 * the same code has been seen `required` times in a row — filtering out the
 * one-off misreads that cause wildly wrong nutrition.
 */
export function createBarcodeConfirmer(required = REQUIRED_CONFIRMATIONS) {
  let last = ''
  let count = 0
  return (code: string): boolean => {
    if (code === last) {
      count += 1
    } else {
      last = code
      count = 1
    }
    return count >= required
  }
}
