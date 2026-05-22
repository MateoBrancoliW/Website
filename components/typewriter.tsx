"use client"

import { useEffect, useMemo, useState } from "react"

type Props = {
  items: string[]
  typingMs?: number
  deletingMs?: number
  holdMs?: number
  className?: string
}

/**
 * Character-level typewriter
 * +
 * Interactive syllable hover expansion
 * +
 * Live inline reflow (neighbor scooching)
 */

export function Typewriter({
  items,
  typingMs = 42,
  deletingMs = 24,
  holdMs = 2600,
  className,
}: Props) {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const target = items[phraseIdx % items.length] ?? ""

  // ───────────────────────────────────────────────────────────────────────────
  // Typewriter engine
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (!isDeleting) {
      if (displayText.length < target.length) {
        timeout = setTimeout(() => {
          setDisplayText(target.slice(0, displayText.length + 1))
        }, typingMs)
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true)
        }, holdMs)
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(target.slice(0, displayText.length - 1))
        }, deletingMs)
      } else {
        setIsDeleting(false)
        setPhraseIdx((i) => (i + 1) % items.length)
      }
    }

    return () => clearTimeout(timeout)
  }, [
    displayText,
    isDeleting,
    target,
    typingMs,
    deletingMs,
    holdMs,
    items.length,
  ])

  // ───────────────────────────────────────────────────────────────────────────
  // Syllable tokenization
  // Lightweight heuristic — not linguistic perfection, but visually strong
  // ───────────────────────────────────────────────────────────────────────────

  const syllables = useMemo(() => {
    return tokenizeIntoSyllables(displayText)
  }, [displayText])

  return (
    <span
      className={className}
      aria-label={items.join(", ")}
    >
      <span
        aria-hidden="true"
        className="inline-flex flex-wrap items-center"
      >
        {syllables.map((syl, i) => (
          <Syllable
            key={`${phraseIdx}-${i}-${syl.text}`}
            text={syl.text}
            trailingSpace={syl.trailingSpace}
          />
        ))}

        <span className="tw-cursor">_</span>
      </span>

      <style jsx>{`
        .tw-cursor {
          display: inline-block;
          margin-left: 1px;
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

// ─────────────────────────────────────────────────────────────────────────────
// Interactive syllable
// ─────────────────────────────────────────────────────────────────────────────

function Syllable({
  text,
  trailingSpace,
}: {
  text: string
  trailingSpace: boolean
}) {
  return (
    <span
      className="tw-syllable pointer-events-auto inline-flex"
    >
      {text}

      {trailingSpace && <span>&nbsp;</span>}

      <style jsx>{`
        .tw-syllable {
          transition:
            font-size 180ms ease-out,
            letter-spacing 180ms ease-out,
            padding 180ms ease-out,
            margin 180ms ease-out,
            font-weight 180ms ease-out;

          font-size: 1em;
          font-weight: 400;

          padding-left: 0px;
          padding-right: 0px;

          letter-spacing: 0em;
        }

        .tw-syllable:hover {
          font-size: 1.12em;

          font-weight: 650;

          letter-spacing: 0.025em;

          padding-left: 0.03em;
          padding-right: 0.08em;
        }
      `}</style>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Syllable tokenizer
// Not linguistically perfect — optimized for visual rhythm
// ─────────────────────────────────────────────────────────────────────────────

function tokenizeIntoSyllables(input: string) {
  const words = input.split(/(\s+)/)

  const output: {
    text: string
    trailingSpace: boolean
  }[] = []

  for (const chunk of words) {
    if (chunk.trim() === "") continue

    const syllables = chunk.match(
      /[^aeiouy]*[aeiouy]+(?:[^aeiouy]{1,2}(?=[^aeiouy]|$))?/gi
    ) || [chunk]

    syllables.forEach((syl, idx) => {
      output.push({
        text: syl,
        trailingSpace: idx === syllables.length - 1,
      })
    })
  }

  return output
}