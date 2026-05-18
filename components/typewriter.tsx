"use client"

/**
 * Typewriter — cycles through an array of strings with a CLI-style typing /
 * deleting animation and a blinking underscore cursor.
 *
 * Accessibility: the visible animated text is hidden from screen readers
 * (`aria-hidden`); the parent <span> carries a single `aria-label` listing
 * every descriptor so assistive tech reads the static content once.
 */

import { useEffect, useState } from "react"

type Phase = "typing" | "holdFull" | "deleting" | "holdEmpty"

type Props = {
  items: string[]
  typingSpeed?: number // ms per char while typing
  deletingSpeed?: number // ms per char while deleting
  pauseFullMs?: number // ms to hold the full string before deleting
  pauseEmptyMs?: number // ms to hold empty before next word
  className?: string
}

export function Typewriter({
  items,
  typingSpeed = 65,
  deletingSpeed = 35,
  pauseFullMs = 1500,
  pauseEmptyMs = 350,
  className,
}: Props) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [phase, setPhase] = useState<Phase>("typing")

  useEffect(() => {
    if (items.length === 0) return
    const current = items[index % items.length] ?? ""
    let timer: ReturnType<typeof setTimeout> | null = null

    if (phase === "typing") {
      if (text.length < current.length) {
        timer = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          typingSpeed,
        )
      } else {
        setPhase("holdFull")
      }
    } else if (phase === "holdFull") {
      timer = setTimeout(() => setPhase("deleting"), pauseFullMs)
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timer = setTimeout(
          () => setText(current.slice(0, text.length - 1)),
          deletingSpeed,
        )
      } else {
        setPhase("holdEmpty")
      }
    } else if (phase === "holdEmpty") {
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % items.length)
        setPhase("typing")
      }, pauseEmptyMs)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [text, phase, index, items, typingSpeed, deletingSpeed, pauseFullMs, pauseEmptyMs])

  return (
    <span className={className} aria-label={items.join(", ")}>
      <span aria-hidden="true">
        {text}
        <span className="tw-cursor">_</span>
      </span>
      <style jsx>{`
        .tw-cursor {
          display: inline-block;
          margin-left: 1px;
          /* steps(1) gives a hard on/off snap rather than a CSS-eased blink */
          animation: tw-blink 1.05s steps(1, end) infinite;
        }
        @keyframes tw-blink {
          0%, 50% {
            opacity: 1;
          }
          50.01%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </span>
  )
}
