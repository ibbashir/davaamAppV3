import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { useNavigate } from "react-router-dom"
import { IconMessageChatbot } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const SIZE = 60
const EDGE_MARGIN = 16
const DRAG_THRESHOLD = 5

type Point = { x: number; y: number }

function clampPosition(pos: Point): Point {
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - SIZE - EDGE_MARGIN)
  const maxY = Math.max(EDGE_MARGIN, window.innerHeight - SIZE - EDGE_MARGIN)
  return {
    x: Math.min(Math.max(EDGE_MARGIN, pos.x), maxX),
    y: Math.min(Math.max(EDGE_MARGIN, pos.y), maxY),
  }
}

function defaultPosition(): Point {
  return clampPosition({
    x: window.innerWidth - SIZE - EDGE_MARGIN,
    y: window.innerHeight - SIZE - EDGE_MARGIN,
  })
}

export function FloatingChatbotButton({
  to,
  label = "Ask Chatbot",
}: {
  to: string
  label?: string
}) {
  const navigate = useNavigate()
  const storageKey = `chatbot-fab-position:${to}`

  const [position, setPosition] = useState<Point>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return clampPosition(JSON.parse(saved))
    } catch {
      // ignore malformed/inaccessible storage
    }
    return defaultPosition()
  })
  const [dragging, setDragging] = useState(false)

  const posRef = useRef(position)
  posRef.current = position
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(
    null
  )

  useEffect(() => {
    const handleResize = () => setPosition((prev) => clampPosition(prev))
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
      moved: false,
    }
    setDragging(true)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragState.current
    if (!state) return
    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY
    if (!state.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      state.moved = true
    }
    if (state.moved) {
      const next = clampPosition({ x: state.originX + dx, y: state.originY + dy })
      posRef.current = next
      setPosition(next)
    }
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragState.current
    dragState.current = null
    setDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!state) return

    if (state.moved) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(posRef.current))
      } catch {
        // ignore storage quota / privacy-mode errors
      }
    } else {
      navigate(to)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      navigate(to)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={cn(
        "group fixed z-50 touch-none select-none",
        dragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{ left: position.x, top: position.y, width: SIZE, height: SIZE }}
    >
      {/* Hover label */}
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>

      <div className={cn("relative h-full w-full", !dragging && "animate-chatbot-float")}>
        {/* Ambient pulsing halo */}
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping [animation-duration:2.5s]" />
        <span className="absolute -inset-1.5 rounded-full bg-primary/20 blur-md" />

        {/* Main button */}
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground shadow-lg ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
          <IconMessageChatbot className="size-7" />
        </div>

        {/* Online indicator */}
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </span>
      </div>
    </div>
  )
}
