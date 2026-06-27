import { useEffect, useRef, useState } from 'react'
import { Flashlight, FlashlightOff } from 'lucide-react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BARCODE_HINTS, createBarcodeConfirmer } from '@/lib/barcode'
import { useTorch } from '@/lib/useTorch'
import { useUIStore } from '@/stores'

export type ScanStatus = 'searching' | 'reading' | 'found' | 'error'

interface BarcodeScanViewProps {
  onDetected: (barcode: string) => void
  // Drives the guide-frame colour (red → amber → green). Controlled by parent.
  status?: ScanStatus
}

const FRAME: Record<ScanStatus, { border: string; glow: string; dot: string; text: string }> = {
  searching: {
    border: 'border-red-500/80',
    glow: 'shadow-[0_0_22px_rgba(239,68,68,0.30)]',
    dot: 'bg-red-500',
    text: 'Line the barcode up inside the box',
  },
  reading: {
    border: 'border-amber-400',
    glow: 'shadow-[0_0_26px_rgba(251,191,36,0.45)]',
    dot: 'bg-amber-400 animate-pulse',
    text: 'Reading barcode…',
  },
  found: {
    border: 'border-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.55)]',
    dot: 'bg-emerald-400',
    text: 'Got it!',
  },
  error: {
    border: 'border-red-500',
    glow: 'shadow-[0_0_26px_rgba(239,68,68,0.45)]',
    dot: 'bg-red-500 animate-pulse',
    text: 'No match — hold the barcode steady',
  },
}

/** Inline camera viewfinder for the log flow with a colour-coded guide frame. */
export function BarcodeScanView({ onDetected, status = 'searching' }: BarcodeScanViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const torch = useTorch(videoRef, streaming)
  const addToast = useUIStore((s) => s.addToast)

  const handleTorch = async () => {
    const { ok, message } = await torch.toggle()
    if (!ok && message) addToast(message, 'error')
  }

  useEffect(() => {
    let cancelled = false
    setCameraError(null)
    setStreaming(false)
    const reader = new BrowserMultiFormatReader(BARCODE_HINTS)
    const confirm = createBarcodeConfirmer()

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
        // Require two consecutive identical reads so a single misdecode (common
        // on curved/glossy packaging) can't log the wrong product.
        if (result && !cancelled && confirm(result.getText())) {
          onDetected(result.getText())
        }
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setStreaming(true)
      })
      .catch((err) => {
        if (cancelled) return
        const name = (err as { name?: string })?.name
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError('Camera access was denied. Allow camera permission and try again.')
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setCameraError('No camera was found on this device.')
        } else {
          setCameraError('Could not start the camera. Please try again.')
        }
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [onDetected])

  if (cameraError) {
    return (
      <div className="rounded-[22px] bg-gradient-to-br from-terracotta/[0.10] to-terracotta/[0.04] p-6 text-center ring-1 ring-terracotta/20">
        <p className="text-sm font-medium text-terracotta">{cameraError}</p>
      </div>
    )
  }

  const f = FRAME[status]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-[22px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />

        {/* Dim everything except the guide box */}
        <div className="pointer-events-none absolute inset-0 bg-black/35" />

        {/* Flashlight toggle — shown while the camera is live (hidden on iOS,
            which can't control the torch from the web at all). */}
        {streaming && !torch.blocked && (
          <button
            type="button"
            onClick={handleTorch}
            aria-label={torch.on ? 'Turn flashlight off' : 'Turn flashlight on'}
            aria-pressed={torch.on}
            className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full backdrop-blur-sm transition-colors ${
              torch.on
                ? 'bg-amber-300 text-espresso shadow-[0_0_18px_rgba(251,191,36,0.65)]'
                : 'bg-black/55 text-white hover:bg-black/70'
            }`}
          >
            {torch.on ? (
              <Flashlight className="h-5 w-5" />
            ) : (
              <FlashlightOff className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Guide frame — colour changes with status */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`relative h-[60%] w-[78%] rounded-[18px] border-2 ${f.border} ${f.glow} transition-colors duration-300`}
          >
            {/* Corner accents */}
            {['left-0 top-0 border-l-4 border-t-4 rounded-tl-[18px]',
              'right-0 top-0 border-r-4 border-t-4 rounded-tr-[18px]',
              'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-[18px]',
              'right-0 bottom-0 border-r-4 border-b-4 rounded-br-[18px]'].map((pos) => (
              <span key={pos} className={`absolute h-6 w-6 ${pos} ${f.border}`} />
            ))}
            {/* Moving scan line */}
            <span className={`absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 rounded-full ${f.dot} opacity-80`} />
          </div>
        </div>

        {/* Status pill */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span className={`h-2 w-2 rounded-full ${f.dot}`} />
            {f.text}
          </span>
        </div>
      </div>
      <p className="text-center text-sm font-medium text-espresso/55">
        Hold it horizontally or vertically — just keep the barcode in the box.
      </p>
    </div>
  )
}
