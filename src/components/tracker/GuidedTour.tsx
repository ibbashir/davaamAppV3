import * as React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { IconX, IconArrowLeft, IconArrowRight, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export interface TourStep {
  /** CSS selector for the element to spotlight. Omit for a centred step. */
  target?: string
  title: string
  body: string
  /** Tab this step lives on — the tour switches there before measuring. */
  tab?: string
  /** Preferred side; flips automatically when there is no room. */
  placement?: "top" | "bottom"
}

interface Rect { top: number; left: number; width: number; height: number }

const PAD = 8
const CARD_W = 320
/** How long to wait for a step's target after a tab switch before giving up. */
const FIND_TIMEOUT_MS = 1500

/**
 * A spotlight tour: dims the page, cuts a hole over the current target and
 * anchors a card to it.
 *
 * The hole is one absolutely-positioned box with an enormous spread shadow
 * rather than four framing divs — it stays a single element as the target
 * moves, so there is nothing to keep in sync while scrolling or resizing.
 */
export function GuidedTour({
  steps, open, onClose, onFinish, onTabChange,
}: {
  steps: TourStep[]
  open: boolean
  /** Dismissed early — Skip, Escape or the close button. */
  onClose: () => void
  /** Reached the end. Both should mark the tour seen. */
  onFinish: () => void
  onTabChange?: (tab: string) => void
}) {
  const [index, setIndex] = React.useState(0)
  const [rect, setRect] = React.useState<Rect | null>(null)
  const step = steps[index]

  React.useEffect(() => { if (open) setIndex(0) }, [open])

  // Switch tabs before looking for the target, or it will not be mounted yet.
  React.useEffect(() => {
    if (!open || !step?.tab) return
    onTabChange?.(step.tab)
    // onTabChange is recreated per render by most callers; depending on it
    // would re-fire the switch on every measurement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, step?.tab])

  /**
   * Measure the target, retrying while the tab's content mounts. A step whose
   * element never appears falls back to a centred card rather than stalling the
   * tour on a blank screen.
   */
  React.useEffect(() => {
    if (!open || !step) return
    let raf = 0
    let cancelled = false
    const started = Date.now()

    const measure = () => {
      if (cancelled) return
      if (!step.target) { setRect(null); return }

      const el = document.querySelector(step.target) as HTMLElement | null
      if (el) {
        const r = el.getBoundingClientRect()
        // A zero-size box means it is mounted but not laid out yet.
        if (r.width > 0 || r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          return
        }
      }
      if (Date.now() - started < FIND_TIMEOUT_MS) raf = requestAnimationFrame(measure)
      else setRect(null)
    }

    measure()
    const onMove = () => measure()
    window.addEventListener("resize", onMove)
    window.addEventListener("scroll", onMove, true)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onMove)
      window.removeEventListener("scroll", onMove, true)
    }
  }, [open, index, step])

  // Bring the target into view so the spotlight is never off-screen.
  React.useEffect(() => {
    if (!open || !step?.target) return
    const el = document.querySelector(step.target) as HTMLElement | null
    el?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" })
  }, [open, index, step])

  const next = React.useCallback(() => {
    if (index >= steps.length - 1) onFinish()
    else setIndex((i) => i + 1)
  }, [index, steps.length, onFinish])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose, next])

  if (!open || !step || typeof document === "undefined") return null

  // Card placement: under the target when it fits, above when it does not,
  // centred when there is no target at all.
  const vh = window.innerHeight
  const vw = window.innerWidth
  let cardTop = vh / 2 - 90
  let cardLeft = vw / 2 - CARD_W / 2
  let arrow: "up" | "down" | null = null

  if (rect) {
    const below = rect.top + rect.height + PAD + 12
    const wantsTop = step.placement === "top" || below + 190 > vh
    if (wantsTop) {
      cardTop = Math.max(12, rect.top - PAD - 190)
      arrow = "down"
    } else {
      cardTop = below
      arrow = "up"
    }
    cardLeft = Math.min(
      Math.max(12, rect.left + rect.width / 2 - CARD_W / 2),
      vw - CARD_W - 12,
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-label="Guided tour">
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-teal-400 transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}

      {/* Click-through guard: the page stays inert while the tour is up. */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="absolute w-[320px] rounded-xl border bg-background p-4 shadow-xl transition-all duration-200"
        style={{ top: cardTop, left: cardLeft }}
        onClick={(e) => e.stopPropagation()}
      >
        {arrow && (
          <span
            className={cn(
              "absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border bg-background",
              arrow === "up"
                ? "-top-1.5 border-r-0 border-b-0"
                : "-bottom-1.5 border-l-0 border-t-0",
            )}
          />
        )}

        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold">{step.title}</h3>
          <button
            onClick={onClose}
            aria-label="Close tour"
            className="-mr-1 -mt-1 rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-teal-500" : "w-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIndex((i) => i - 1)}>
                <IconArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {index === steps.length - 1 ? (
                <><IconCheck className="mr-1 h-4 w-4" /> Done</>
              ) : (
                <>Next <IconArrowRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>

        {index === 0 && (
          <button
            onClick={onClose}
            className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Skip the tour
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
